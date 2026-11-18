const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const rows=new Map([['owner',{revision:8,payload:JSON.stringify({overrides:{'CC-UI-01':{status:'Approved'}},history:[]}),updated_at:'2026-10-27'}],['portfolio:v1:owner',{revision:2,payload:JSON.stringify({overrides:{'GAP-12':{status:'Parked',note:'Owner decision wins'}},history:[]}),updated_at:'2026-10-28'}]]);
rows.set('portfolio:v1:old-owner',{revision:1,payload:JSON.stringify({overrides:{'C01':{owner:'Coach Drew',status:'Working on it',nextStep:'Old request',updatedAt:'2026-10-27T12:00:00Z'}},history:[]}),updated_at:'2026-10-27'});
rows.set('portfolio:v1:new-owner',{revision:1,payload:JSON.stringify({overrides:{'C01':{owner:'New explicit owner',status:'Waiting',nextStep:'Later choice',updatedAt:'2026-10-28T15:00:00Z'}},history:[]}),updated_at:'2026-10-28'});
const original=JSON.stringify(rows.get('owner')),privateOriginal=JSON.stringify(rows.get('portfolio:v1:owner'));
const DB = {
 prepare(sql) {
  return {
   bind(...values) {
    return {
     async first() { return rows.get(values[0]) ?? null; },
     async run() {
      if (sql.startsWith('UPDATE')) {
       const [payload,updated,key,rev]=values, old=rows.get(key);
       if (!old || old.revision!==rev) return {meta:{changes:0}};
       rows.set(key,{payload,updated_at:updated,revision:rev+1});
       return {meta:{changes:1}};
      }
      const [key,payload,updated]=values;
      if(rows.has(key)) return {meta:{changes:0}};
      rows.set(key,{payload,updated_at:updated,revision:1});
      return {meta:{changes:1}};
     }
    };
   }
  };
 }
};
const cache={};
function load(path){if(cache[path])return cache[path];const exports={};cache[path]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,Date,crypto,TextEncoder,Uint8Array,Map,Set,require(id){if(id==='cloudflare:workers')return{env:{DB}};if(id==='zod')return require('zod');if(id==='./portfolio.json')return JSON.parse(fs.readFileSync('lib/portfolio.json'));if(id.startsWith('@/lib/')){const p=id.slice(2);return id.endsWith('.json')?JSON.parse(fs.readFileSync(p)):load(p+'.ts')}throw Error(id)}},{filename:path});return exports}
const api=load('app/api/daily-audit/route.ts'),portfolio=load('app/api/portfolio/route.ts');
const asOf=new Date(Date.now()-60000).toISOString();
const snapshot={kind:'setup',asOf,summary:'Verified setup record with no claim that a scheduled audit has completed.',coachActions:[],completed:[],inProgress:[],gaps:['Current cash baseline is unverified.'],next:[],sources:[{label:'Audit source',url:'https://chatgpt.com/library?file_id=test'}],recordUpdates:[{id:'GAP-12',status:'Waiting',nextStep:'Review the current website handoff.',note:'Automatic evidence projection only.',proof:'Read source handoff at https://example.com/evidence',observedAt:asOf}]};
const post=(p,origin)=>new Request('https://dashboard.test/api/daily-audit',{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(p)});
const input={revision:0,runId:'setup-2026-10-28',snapshot};
(async()=>{
 assert.equal((await(await api.GET()).json()).revision,0);
 assert.equal((await api.POST(post(input,'https://wrong.test'))).status,403);
 assert.equal((await api.POST(post({...input,snapshot:{...snapshot,coachActions:['a','b','c','d']}}))).status,400);
 for(const patch of [{id:'unknown-record'},{id:'GAP-01'},{status:'Done'},{owner:'Someone else'}])assert.equal((await api.POST(post({...input,snapshot:{...snapshot,recordUpdates:[{...snapshot.recordUpdates[0],...patch}]}}))).status,400);
 assert.equal((await api.POST(post({...input,snapshot:{...snapshot,recordUpdates:[snapshot.recordUpdates[0],snapshot.recordUpdates[0]]}}))).status,400);
 assert.equal((await api.POST(post({...input,snapshot:{...snapshot,asOf:new Date(Date.now()+3600000).toISOString()}}))).status,400);
 assert.equal((await api.POST(post(input))).status,200);
 const first=await(await api.GET()).json();assert.equal(first.revision,1);assert.equal(first.history.length,1);assert.equal(first.snapshot.kind,'setup');
 const repeat=await(await api.POST(post(input))).json();assert.equal(repeat.duplicate,true);assert.equal(repeat.revision,1);
 assert.equal((await api.POST(post({...input,snapshot:{...snapshot,summary:'A changed result cannot reuse the same run identifier.'}}))).status,409);
 assert.equal((await api.POST(post({...input,runId:'another-run'}))).status,409);
 assert.equal((await api.POST(post({...input,revision:1,runId:'stale-run-01',snapshot:{...snapshot,asOf:'2020-01-01T00:00:00Z',recordUpdates:[]}}))).status,409);
 const other=await(await portfolio.GET(new Request('https://dashboard.test/api/portfolio',{headers:{'oai-authenticated-user-id':'other'}}))).json();
 assert.equal(other.items.find(i=>i.id==='GAP-12').status,'Waiting');assert.equal(other.items.find(i=>i.id==='C01').owner,'Kev');
 const own=await(await portfolio.GET(new Request('https://dashboard.test/api/portfolio',{headers:{'oai-authenticated-user-id':'owner'}}))).json();assert.equal(own.items.find(i=>i.id==='GAP-12').status,'Parked');assert.equal(own.items.find(i=>i.id==='GAP-12').note,'Owner decision wins');
 for(const [uid,expected] of [['old-owner','Kev'],['new-owner','New explicit owner']]){const result=await(await portfolio.GET(new Request('https://dashboard.test/api/portfolio',{headers:{'oai-authenticated-user-id':uid}}))).json();assert.equal(result.items.find(i=>i.id==='C01').owner,expected)}
 assert.equal(JSON.parse(rows.get('portfolio:v1:old-owner').payload).overrides.C01.owner,'Coach Drew');
 const concurrent=await Promise.all(['race-audit-1','race-audit-2'].map(runId=>api.POST(post({...input,revision:1,runId}))));assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
 assert.equal(JSON.stringify(rows.get('owner')),original);assert.equal(JSON.stringify(rows.get('portfolio:v1:owner')),privateOriginal);
 assert.equal((await(await api.GET()).json()).history.length,2);
 console.log('PASS: strict evidence schema, excluded ownership, no automatic Done/owner changes, source readback, idempotency, conflicting retries, stale/future rejection, concurrent revision protection and private owner precedence.');
})().catch(e=>{console.error(e);process.exit(1)});
