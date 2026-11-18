const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),zod=require('zod');
const rows=new Map();
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
function load(file){const exports={};const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(src,{exports,Response,Request,URL,Date,Map,Set,crypto,require(id){if(id==='cloudflare:workers')return {env:{DB}};if(id==='zod')return zod;if(id.startsWith('@/lib/')){const path=id.slice(2);return id.endsWith('.json')?JSON.parse(fs.readFileSync(path,'utf8')):load(path+'.ts')}throw Error(id)}},{filename:file});return exports}
const sync=load('app/api/coach-core-sync/route.ts'),dash=load('app/api/dashboard/route.ts');
const request=(body)=>new Request('https://example.test/api/coach-core-sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const user=()=>new Request('https://example.test/api/dashboard',{headers:{'oai-authenticated-user-id':'owner'}});
(async()=>{
 const initial=await (await sync.GET()).json();assert.equal(initial.instructions.version,2);
 assert.equal((await dash.GET(new Request('https://example.test/api/dashboard'))).status,401);
 const base=await (await dash.GET(user())).json();assert.equal(base.tasks.find(t=>t.id==='CC-N2-ACCEPT-01').status,'Verified complete');
 const now=new Date(Date.now()+1000).toISOString();const update={id:'CC-QA-01',status:'Review',action:'Independent review is still required for all unresolved gates.',notes:'A concrete evidence update for isolated route verification.',evidence:'Scoped investigation delivered; independent browser acceptance remains pending.',links:['https://github.com/DigitalBlueprint239/coach-core-ai/issues/39'],updated:now};
 const snapshot={...initial.snapshot,taskUpdates:[update]};assert.equal((await sync.POST(request({revision:0,snapshot}))).status,200);
 const shown=await (await dash.GET(user())).json();assert.equal(shown.tasks.find(t=>t.id===update.id).status,'Review');assert(shown.history.some(h=>h.taskId===update.id&&h.to==='Review'));
 assert.equal((await sync.POST(request({revision:0,snapshot}))).status,409);
 assert.equal((await sync.POST(request({revision:1,snapshot:{...snapshot,taskUpdates:[{...update,id:'CC-D1'}]}}))).status,400);
 assert.equal((await sync.POST(request({revision:1,snapshot:{...snapshot,taskUpdates:[{...update,status:'Approved'}]}}))).status,400);
 assert.equal((await sync.POST(request({revision:1,snapshot:{...snapshot,taskUpdates:[{...update,id:'BDN-001'}]}}))).status,400);
 assert.equal((await sync.POST(request({revision:1,snapshot:initial.snapshot}))).status,200);assert.equal((await (await sync.GET()).json()).snapshot.taskUpdates.length,1);
 const older={...update,status:'Pending',updated:'2026-10-01T00:00:00Z'};assert.equal((await sync.POST(request({revision:2,snapshot:{...snapshot,taskUpdates:[older]}}))).status,200);assert.equal((await (await sync.GET()).json()).snapshot.taskUpdates[0].status,'Review');
 rows.set('owner',{revision:1,updated_at:now,payload:JSON.stringify({overrides:{[update.id]:{status:'Hold',notes:'Owner later decision',updated:new Date(Date.parse(now)+1000).toISOString()}},history:[]})});assert.equal((await (await dash.GET(user())).json()).tasks.find(t=>t.id===update.id).status,'Hold');
 rows.set('owner',{revision:1,updated_at:now,payload:JSON.stringify({overrides:{[update.id]:{status:'Pending',updated:'2026-10-01T00:00:00Z'}},history:[]})});assert.equal((await (await dash.GET(user())).json()).tasks.find(t=>t.id===update.id).status,'Review');
 console.log('PASS: live route handlers with isolated D1 mock; sync projects to board/history, rejects decisions/other projects/approval, preserves omitted/newer evidence, enforces revision conflicts and later owner edits.');
})().catch(e=>{console.error(e);process.exitCode=1});
