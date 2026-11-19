const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),{webcrypto,randomUUID}=require('node:crypto');
const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE dashboards(user_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL)');for(const f of ['drizzle/0001_eager_star_brand.sql','drizzle/0002_equal_spencer_smythe.sql'])db.exec(fs.readFileSync(f,'utf8'));
const DB={
 prepare(sql){return {bind(...v){return {
  async first(){return db.prepare(sql).get(...v)||null},
  async all(){return {results:db.prepare(sql).all(...v)}},
  async run(){return {meta:{changes:Number(db.prepare(sql).run(...v).changes)}}}
 }}}},
 async batch(s){db.exec('BEGIN');try{for(const x of s)await x.run();db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
};
const cache={};function load(file){file=path.normalize(file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file));if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Response,Request,URL,Headers,TextEncoder,Date,Map,Set,crypto:webcrypto,console,require(id){if(id==='cloudflare:workers')return {env:{DB}};if(id.startsWith('@/')||id.startsWith('.')){const f=id.startsWith('@/')?id.slice(2):path.join(path.dirname(file),id);return load(f.endsWith('.json')?f:f+'.ts')}return require(id)}},{filename:file});return exports}
const mcp=load('app/mcp/route.ts');const origin='https://test.local';
async function call(name,args={},uid='owner'){const r=await mcp.POST(new Request(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json',...(uid?{'oai-authenticated-user-id':uid}:{})},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));const rpc=await r.json();if(rpc.error)return rpc;return {...rpc.result,data:JSON.parse(rpc.result.content[0].text)}}
(async()=>{
 assert((await call('get_execution_work',{},null)).isError);console.log('PASS unsigned execution access rejected');
 const work=await call('get_execution_work');assert(!work.isError);assert(work.data.records.tasks.some(t=>t.id==='CC-005'));assert(work.data.portfolio.items.length);assert(work.data.tickets.items);console.log('PASS current records, portfolio and tickets use authenticated owner');
 const proof={taskId:'CC-005',runId:'transport-test-run',token:randomUUID(),requestId:randomUUID(),action:'acquire',receipt:'Inspecting transport in isolated test.'};let r=await call('change_task_claim',proof);assert(!r.isError);const claim={runId:proof.runId,token:proof.token,generation:r.data.generation};assert((await call('change_task_claim',{...proof,requestId:randomUUID(),token:randomUUID()})).isError);console.log('PASS acquisition exclusive through MCP transport');
 assert.equal((await call('get_task_claim',{taskId:'CC-005'},'different-owner')).data.claim,null);console.log('PASS caller identity cannot read another owner claim');
 const task=work.data.records.tasks.find(t=>t.id==='CC-005');const update={id:task.id,revision:work.data.records.revision,status:task.status,notes:task.notes,evidence:task.evidence+'\nIsolated transport test receipt.',deadline:task.deadline||'',deadlineConfirmed:!!task.deadlineConfirmed,accepted:!!task.accepted,claim};r=await call('save_task_update',update);assert(!r.isError,JSON.stringify(r));const read=await call('get_execution_work');assert(read.data.records.tasks.find(t=>t.id===task.id).evidence.endsWith('Isolated transport test receipt.'));assert.equal(read.data.records.tasks.find(t=>t.id===task.id).owner,task.owner);console.log('PASS claimed save and readback preserve owner and status');
 assert((await call('save_task_update',{...update,revision:read.data.records.revision,claim:{...claim,token:randomUUID()}})).isError);console.log('PASS wrong holder update rejected');
 assert(!(await call('change_task_claim',{...proof,requestId:randomUUID(),generation:claim.generation,action:'release',receipt:'Isolated transport test complete; work ended.'})).isError);assert((await call('save_task_update',{...update,revision:read.data.records.revision})).isError);console.log('PASS released holder fenced');
 assert(!(await call('get_queue_reconciliation')).isError);assert((await call('save_queue_reconciliation',{})).isError);console.log('PASS reconciliation exposed with strict existing validation');
 console.log('8 authenticated execution transport checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
