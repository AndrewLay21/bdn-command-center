const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ts=require('typescript'),zod=require('zod');
const rows=new Map(),cache=new Map();
let brokenReadback=false;
const DB={prepare(sql){return {bind(...v){return {
 async first(){return brokenReadback&&v[0]==='system:dashboard-connection:v1'?null:rows.get(v[0])??null},
 async run(){
  if(sql.startsWith('UPDATE')){const [payload,updated,key,revision]=v,old=rows.get(key);if(!old||old.revision!==revision)return {meta:{changes:0}};rows.set(key,{revision:revision+1,payload,updated_at:updated});return {meta:{changes:1}}}
  const [key,payload,updated]=v,old=rows.get(key);
  if(old&&!sql.includes('ON CONFLICT'))return {meta:{changes:0}};
  rows.set(key,{revision:(old?.revision??0)+1,payload,updated_at:updated});return {meta:{changes:1}};
 }
}}}}};
function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(src,{exports,Response,Request,URL,Date,Map,Set,crypto:crypto.webcrypto,require(id){if(id==='cloudflare:workers')return {env:{DB}};if(id==='zod')return zod;if(id.startsWith('@/lib/')){let path=id.slice(2);return path.endsWith('.json')?JSON.parse(fs.readFileSync(path,'utf8')):load(path+'.ts')}if(id.startsWith('.'))return load(require('node:path').join(require('node:path').dirname(file),id)+'.ts');throw Error(id)}},{filename:file});return exports}
const health=load('app/api/connection-health/route.ts'),mcp=load('app/mcp/route.ts');
const req=(path,body,headers={})=>new Request('https://example.test'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const call=(name,args={})=>mcp.POST(req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}}));
const unpack=async response=>(await response.json()).result;
let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
 rows.set('owner',{revision:4,payload:JSON.stringify({overrides:{'CC-UI-01':{status:'Hold',updated:'2026-10-24T12:00:00Z'}},history:[{id:'original'}]}),updated_at:'2026-10-24T12:00:00Z'});
 rows.set('system:portfolio-execution:v1',{revision:24,payload:'{"paused":false,"jobs":{"old":"preserved"}}',updated_at:'2026-10-16T12:00:00Z'});
 const original=[...rows].map(([k,v])=>[k,JSON.stringify(v)]);
 await check('MCP discovery and supported protocol',async()=>{const d=await (await mcp.POST(req('/mcp',{jsonrpc:'2.0',id:1,method:'server/discover'}))).json();assert.equal(d.result.supportedVersions[0],'2026-07-28')});
 await check('tool list exposes exactly the three bounded operations',async()=>{const d=await (await mcp.POST(req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'}))).json();assert.deepEqual(Array.from(d.result.tools,t=>t.name),['get_coach_core_status','update_coach_core_status','check_dashboard_connection'])});
 await check('unverified connection starts empty',async()=>assert.equal((await (await health.GET()).json()).connection,null));
 await check('connection tool saves and reads back durable metadata',async()=>{const d=await unpack(await call('check_dashboard_connection',{probeId:'connection-probe-1'}));assert.equal(d.isError,false);assert.equal(JSON.parse(d.content[0].text).verified,true);const r=await (await health.GET()).json();assert.equal(r.connection.probeId,'connection-probe-1');assert.equal(r.connection.revision,1)});
 await check('repeated probe is idempotent',async()=>{await call('check_dashboard_connection',{probeId:'connection-probe-1'});assert.equal((await (await health.GET()).json()).connection.revision,1)});
 await check('fresh probe persists across independent GET requests',async()=>{await call('check_dashboard_connection',{probeId:'connection-probe-2'});const d=await (await health.GET()).json();assert.equal(d.connection.probeId,'connection-probe-2');assert.equal(d.connection.revision,2)});
 await check('probe cannot alter private owner or execution rows',async()=>{for(const [k,v]of original)assert.equal(JSON.stringify(rows.get(k)),v);assert.equal(rows.size,3)});
 await check('failed probe readback never returns verified',async()=>{brokenReadback=true;const d=await unpack(await call('check_dashboard_connection',{probeId:'connection-probe-3'}));assert.equal(d.isError,true);assert(!JSON.parse(d.content[0].text).verified);brokenReadback=false});
 await check('unknown MCP tool fails without dispatch',async()=>assert.equal((await (await call('delete_all_tasks')).json()).error.code,-32602));
 await check('cross-origin MCP and probe writes refused',async()=>{assert.equal((await mcp.POST(req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'},{Origin:'https://evil.test'}))).status,403);assert.equal((await health.POST(req('/api/connection-health',{probeId:'connection-probe-4'},{Origin:'https://evil.test'}))).status,403)});
 await check('invalid probe and extra fields refused',async()=>{for(const args of [{probeId:'short'},{probeId:'valid-probe-1',tasks:[]}])assert.equal((await unpack(await call('check_dashboard_connection',args))).isError,true)});
 let snapshot;
 await check('shared evidence reads retain revision and instructions',async()=>{const d=JSON.parse((await unpack(await call('get_coach_core_status'))).content[0].text);assert.equal(d.revision,0);assert.equal(d.instructions.version,2);snapshot=d.snapshot});
 await check('shared evidence write reuses revision-checked route',async()=>{const d=await unpack(await call('update_coach_core_status',{revision:0,snapshot}));assert.equal(d.isError,false);assert.equal(JSON.parse(d.content[0].text).revision,1)});
 await check('stale revision rejected via MCP',async()=>assert.equal((await unpack(await call('update_coach_core_status',{revision:0,snapshot}))).isError,true));
 await check('founder decisions and BDN records cannot be updated via Coach Core MCP',async()=>{for(const id of ['CC-D1','BDN-001']){const bad={...snapshot,taskUpdates:[{id,status:'Review',action:'No authority to change unrelated records.',notes:'This attempted write must be rejected.',evidence:'Synthetic isolated negative security test.',links:['https://github.com/DigitalBlueprint239/coach-core-ai/issues/39'],updated:new Date().toISOString()}]};assert.equal((await unpack(await call('update_coach_core_status',{revision:1,snapshot:bad}))).isError,true)}});
 await check('owner and execution records remain byte-identical after all tools',async()=>{for(const [k,v]of original)assert.equal(JSON.stringify(rows.get(k)),v)});
 console.log(`${checks}/${checks} checks passed. Route tests use isolated D1 storage; hosted access/persistence requires separate verification.`);
})().catch(e=>{console.error(e);process.exitCode=1});
