const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const {execFileSync}=require('node:child_process');
const plan=JSON.parse(fs.readFileSync('lib/tradelab-plan.json'));
const current=JSON.parse(fs.readFileSync('lib/portfolio.json'));
const prior=JSON.parse(execFileSync('git',['show','HEAD:lib/portfolio.json'],{encoding:'utf8'}));
const ids=new Set(['A30','GAP-53','X77']);
assert.equal(current.items.length,prior.items.length);
assert.equal(new Set(current.items.map(i=>i.id)).size,current.items.length);
for(const item of current.items){const old=prior.items.find(x=>x.id===item.id);if(ids.has(item.id))assert.deepEqual(item.original,old.original);else assert.deepEqual(item,old)}
const savedHistory=[{itemId:'A30',note:'Earlier choice retained',at:'2026-10-27T12:00:00Z'}];
const rows=new Map([['portfolio:v1:owner',{revision:4,payload:JSON.stringify({overrides:{A30:{status:'Parked',owner:'Old owner',updatedAt:'2026-10-27T12:00:00Z'},'GAP-06':{status:'Done',owner:'Mansa Musa',updatedAt:'2026-10-28T16:20:25Z'}},history:savedHistory}),updated_at:'2026-10-28T16:20:25Z'}]]);
const original=JSON.stringify([...rows]);
const DB={
 prepare(){
  return {
   bind(...args){return {async first(){return rows.get(args[0])??null}}},
   async all(){return {results:[...rows].filter(([key])=>key.startsWith('portfolio:v1:')).slice(0,2).map(([,value])=>value)}}
  };
 }
};
const cache={};
function load(file){if(cache[file])return cache[file];const exports={};cache[file]=exports;const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});assert.ok(!output.diagnostics?.length,'No syntax errors');vm.runInNewContext(output.outputText,{exports,Request,Response,URL,Date,Map,Set,require(id){if(id==='cloudflare:workers')return{env:{DB}};if(id==='zod')return require('zod');const p=id.startsWith('@/')?id.slice(2):id.startsWith('.')?path.join(path.dirname(file),id):null;if(!p)throw Error(id);return p.endsWith('.json')?JSON.parse(fs.readFileSync(p)):load(p+'.ts')}},{filename:file});return exports}
const merge=load('lib/portfolio-merge.ts').mergePortfolioItem,base=current.items.find(i=>i.id==='A30');
assert.equal(merge(base,{status:'Parked',updatedAt:'2026-10-27T12:00:00Z'}).status,plan.status);
assert.equal(merge(base,undefined,{status:'Reference',updatedAt:'2026-10-27T12:00:00Z'}).status,plan.status);
assert.equal(merge(base,{status:'Parked',updatedAt:'2026-10-29T12:00:00Z'}).status,'Parked');
assert.equal(merge(base,{status:'Waiting',updatedAt:'2026-10-29T12:00:00Z'},{status:'Working on it',updatedAt:'2026-10-29T12:30:00Z'}).status,'Waiting');
assert.equal(plan.protectedBlock.hoursPerDay*plan.protectedBlock.byDay.length,20);
assert.equal(plan.protectedBlock.rrule,'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
assert.equal(plan.calendar.busy,true);assert.equal(plan.calendar.externalInvitees,0);
assert.equal(plan.timezone,'America/New_York');
for(const date of ['2026-10-30T12:00:00Z','2026-11-02T13:00:00Z'])assert.equal(new Intl.DateTimeFormat('en-GB',{timeZone:plan.timezone,hour:'2-digit',minute:'2-digit'}).format(new Date(date)),'08:00');
assert.equal(plan.capacity.remainingWeeklyCapacity,null);
assert.equal(plan.nextDeliverable.status,'Waiting for actual screenshots and exact candle table');
(async()=>{
 const api=load('app/api/weekly-plan/route.ts');
 const r=await api.GET(new Request('https://test/api/weekly-plan'));assert.equal(r.status,200);
 const body=await r.json();assert.equal(body.records.length,3);assert.equal(body.privateOverridesReadable,true);assert.equal(body.portfolioRevision,4);assert.equal(body.records.find(i=>i.id==='A30').status,plan.status);assert.equal(body.recordHistory.length,1);assert.equal(JSON.stringify([...rows]),original);
 rows.set('portfolio:v1:second',{revision:1,payload:'{"overrides":{},"history":[]}',updated_at:'2026-10-28'});
 const ambiguous=await(await api.GET(new Request('https://test/api/weekly-plan'))).json();assert.equal(ambiguous.privateOverridesReadable,false);assert.equal(ambiguous.portfolioRevision,null);
 const signed=await(await api.GET(new Request('https://test/api/weekly-plan',{headers:{'oai-authenticated-user-id':'owner'}}))).json();assert.equal(signed.privateOverridesReadable,true);assert.equal(signed.portfolioRevision,4);
 console.log('PASS: existing IDs reused, 243 unrelated records and original histories preserved, old/new decision precedence, scoped readback, ambiguous-owner handling, no writes, weekly capacity and DST.');
})().catch(e=>{console.error(e);process.exit(1)});
