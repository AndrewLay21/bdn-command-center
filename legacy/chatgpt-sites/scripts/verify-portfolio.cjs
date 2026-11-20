const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const rows=new Map([['owner',{revision:8,payload:JSON.stringify({overrides:{'CC-UI-01':{status:'Approved'}},history:[]}),updated_at:'2026-10-27'}]]);
const legacy=JSON.stringify(rows.get('owner'));
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
function load(path){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,Date,crypto,require(id){if(id==='cloudflare:workers')return{env:{DB}};if(id==='zod')return require('zod');if(id==='./portfolio.json')return JSON.parse(fs.readFileSync('lib/portfolio.json','utf8'));if(id.startsWith('@/lib/')){const p=id.slice(2);return id.endsWith('.json')?JSON.parse(fs.readFileSync(p,'utf8')):load(p+'.ts')}throw Error(id)}},{filename:path});return exports}
const api=load('app/api/portfolio/route.ts');
const get=(uid='owner')=>new Request('https://dashboard.test/api/portfolio',{headers:uid?{'oai-authenticated-user-id':uid}:{}});
const post=(p,uid='owner',origin='https://dashboard.test')=>new Request('https://dashboard.test/api/portfolio',{method:'POST',headers:{'content-type':'application/json','origin':origin,...(uid?{'oai-authenticated-user-id':uid}:{})},body:JSON.stringify(p)});
(async()=>{
 assert.equal((await api.GET(get(''))).status,401);
 const initial=await(await api.GET(get())).json();assert.equal(initial.items.length,246);assert.equal(initial.items.filter(i=>i.type==='client').length,2);assert.equal(initial.items.filter(i=>i.type==='step').length,56);assert.equal(initial.items.filter(i=>i.type==='work').length,188);
 const edit={id:'GAP-01',revision:0,status:'Waiting',owner:'Coach Drew',nextStep:'Check the latest client response.',note:'Waiting on the current work list.',proof:'',accepted:false};
 assert.equal((await api.POST(post(edit,''))).status,401);assert.equal((await api.POST(post(edit,'owner','https://wrong.test'))).status,403);
 assert.equal((await api.POST(post({...edit,id:'not-a-record'}))).status,404);
 assert.equal((await api.POST(post({...edit,status:'Done'}))).status,400);
 assert.equal((await api.POST(post(edit))).status,200);
 const saved=await(await api.GET(get())).json();assert.equal(saved.revision,1);assert.equal(saved.items.find(i=>i.id==='GAP-01').status,'Waiting');assert.equal(saved.history.length,1);
 assert.equal((await api.POST(post(edit))).status,409);
 const other=await(await api.GET(get('other-owner'))).json();assert.equal(other.revision,0);assert.equal(other.items.find(i=>i.id==='GAP-01').status,'Waiting');assert.equal(other.items.find(i=>i.id==='C01').owner,'Kev');assert.notEqual(other.items.find(i=>i.id==='GAP-01').note,'Waiting on the current work list.');
 assert.equal((await api.POST(post({...edit,revision:1,status:'Done',accepted:true,proof:'Dated client checklist reviewed with supporting delivery links.'}))).status,200);
 assert.equal(JSON.stringify(rows.get('owner')),legacy);
 assert.equal((await(await api.GET(get())).json()).items.find(i=>i.id==='GAP-01').status,'Done');
 console.log('PASS: 246 records, two clients, authorization, origin, validation, conflict handling, durable readback, user isolation and preserved original decisions.');
})().catch(e=>{console.error(e);process.exit(1)});
