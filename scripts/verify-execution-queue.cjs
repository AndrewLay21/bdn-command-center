const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),zod=require('zod');
const rows=new Map();let injectOwnerAtCommit=false;
const DB = {
 prepare(sql) {
  return {
   async first(){return sql.includes("NOT LIKE") ? [...rows.keys()].some(k=>!k.startsWith("system:")) ? {user_id:"owner"}:null : null;},
   bind(...values) {
    return {
	     async first() { if(sql.includes(' AS blocked'))return {blocked:rows.has(values[0])?1:0};return rows.get(values[0]) ?? null; },
     async run() {
      if(injectOwnerAtCommit){rows.set('owner',{revision:1,payload:'{}'});injectOwnerAtCommit=false;}
      if(sql.includes('NOT EXISTS')&&rows.has('owner'))return {meta:{changes:0}};
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

const queue=load('app/api/execution-queue/route.ts');
const seed=JSON.parse(fs.readFileSync('lib/seed.json','utf8'));
const plan=JSON.parse(fs.readFileSync('lib/execution-plan.json','utf8'));
const expectedOpen=plan.filter(p=>!['Approved','Verified complete','Reported complete'].includes(seed.find(t=>t.id===p.id).status)).length;
const req=(b,uid='owner',origin='https://example.test')=>new Request('https://example.test/api/execution-queue',{method:'POST',headers:{'Content-Type':'application/json',origin,...(uid?{'oai-authenticated-user-id':uid}:{})},body:JSON.stringify(b)});
const get=async(uid='owner')=>queue.GET(new Request('https://example.test/api/execution-queue',{headers:{...(uid?{'oai-authenticated-user-id':uid}:{})}}));
let checks=0;
const post=async(body,expected,uid='owner',origin='https://example.test')=>{const r=await queue.POST(req(body,uid,origin));assert.equal(r.status,expected,JSON.stringify(await r.clone().json()));checks++;return r.json()};
(async()=>{
	 assert.equal((await get('')).status,401);checks++;
	 let q=await(await get()).json();assert.equal(q.records.length,47);assert.equal(new Set(q.records.map(t=>t.id)).size,47);assert.equal(q.revision,0);assert.equal(q.summary.open,expectedOpen);assert.equal(q.legacyExecutionBlocked,true);assert.equal(q.runnerStatus.muse,'External runtime not inspected; activity unverified here');assert(!q.ownerEditsNeedReconciliation);checks++;
	 const b={revision:0,action:'claim',job:'BDN-SPONSOR-01',actor:'builder',runId:'build-001'};
	 await post(b,401,'');await post(b,403,'owner','https://elsewhere.test');
	 for(const action of ['claim','deliver','claim-review','verify','block','resume'])await post({...b,action},409);
	 assert.equal(rows.has('system:portfolio-execution:v1'),false);
	 rows.set('owner',{revision:1,payload:'{"overrides":{},"history":[]}',updated_at:new Date().toISOString()});q=await(await get()).json();assert(q.ownerEditsNeedReconciliation);rows.delete('owner');checks++;
	 await post({...b,action:'pause'},200);q=await(await get()).json();assert.equal(q.revision,1);assert.equal(q.paused,true);assert.equal(q.history[0].action,'pause');checks++;
	 await post({...b,action:'pause'},409);
	 console.log(`PASS: ${checks} signed-in queue projection checks; legacy dispatch/resume fail closed and explicit pause persists without parent closure.`);
})().catch(e=>{console.error(e);process.exitCode=1});
