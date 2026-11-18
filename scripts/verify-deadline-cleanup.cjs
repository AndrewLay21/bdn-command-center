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
 const ids=['BDN-001','CC-003','CC-010','CC-CODEX-02','CC-CODEX-03','CC-NEXT-02','POD-QC-02','POD-QC-05',...Array.from({length:10},(_,i)=>'CC-D'+(i+1)),'CC-NEXT-04','CC-006','POD-VOICE-01','BDN-CAT-001','BDN-CAT-002'];
 const seed=load('lib/seed.json');
 const overrides=Object.fromEntries(ids.map((id,i)=>[id,{status:i<11?'Verified complete':'Approved',notes:'Existing approved scope and release HOLD',evidence:'Existing independent evidence preserved verbatim.',deadline:'2000-01-01T00:00:00Z',deadlineConfirmed:false,updated:'2099-01-01T00:00:00Z',...(i===1?{accepted:false}:i===2?{accepted:true}:{})}]));
 db.prepare('INSERT INTO dashboards VALUES (?,?,?,?)').run('owner',0,JSON.stringify({overrides,history:[{id:'old',at:'2000-01-01',note:'preserve history'}]}),'2000-01-01');
 const baseline=(await call('get_execution_work')).data.records.tasks;
 assert((await call('clear_obsolete_deadline',{id:ids[0],revision:0,claim:{}},null)).isError);
 assert((await call('clear_obsolete_deadline',{id:ids[0],revision:0,claim:{runId:'not-holder',token:randomUUID(),generation:1}})).isError);
 for(const id of ids){
  const proof={taskId:id,runId:'deadline-cleanup-test',token:randomUUID(),requestId:randomUUID(),action:'acquire',receipt:'Isolated test only'};
  const acquire=await call('change_task_claim',proof);assert(!acquire.isError,JSON.stringify(acquire));
  const claim={runId:proof.runId,token:proof.token,generation:acquire.data.generation};
  const before=(await call('get_execution_work')).data.records;
  const args={id,revision:before.revision,claim};
  assert((await call('clear_obsolete_deadline',{...args,accepted:true})).isError);
  assert((await call('clear_obsolete_deadline',{...args,status:'Pending'})).isError);
  assert((await call('clear_obsolete_deadline',{...args,revision:999})).isError);
  assert((await call('clear_obsolete_deadline',{...args,claim:{...claim,token:randomUUID()}})).isError);
  const original=before.tasks.find(t=>t.id===id);
  const legacyRequest={...args,status:original.status,notes:original.notes,evidence:original.evidence,deadline:'',deadlineConfirmed:false,accepted:false};
  if(!Object.prototype.hasOwnProperty.call(original,'accepted'))assert((await call('save_task_update',{...legacyRequest,notes:original.notes+' changed'})).isError);
  const saved=await call(Object.prototype.hasOwnProperty.call(original,'accepted')?'clear_obsolete_deadline':'save_task_update',Object.prototype.hasOwnProperty.call(original,'accepted')?args:legacyRequest);assert(!saved.isError,JSON.stringify(saved));
  const after=(await call('get_execution_work')).data.records;
  const t=before.tasks.find(t=>t.id===id),a=after.tasks.find(t=>t.id===id);
  assert.deepEqual(a,{...t,deadline:'',deadlineConfirmed:false});
  const raw=JSON.parse(db.prepare('SELECT payload FROM dashboards WHERE user_id=?').get('owner').payload);
  assert.deepEqual(raw.overrides,overrides);assert(raw.history.some(h=>h.id==='old'));
  assert.equal(raw.history[0].previousDeadline,t.deadline);assert.equal(raw.history[0].from,raw.history[0].to);
  assert((await call('clear_obsolete_deadline',{...args,revision:after.revision})).isError);
  assert(!(await call('change_task_claim',{...proof,requestId:randomUUID(),generation:claim.generation,action:'release',receipt:'Isolated test complete; explicitly released.'})).isError);
 }
 console.log('PASS all 23 legacy records: deadline cleared, all other projected fields and stored overrides exact, history retained, claims released');
 const id=ids[0];
 for(const [deadline,deadlineConfirmed] of [['2999-01-01T00:00:00Z',false],['2000-01-01T00:00:00Z',true]]){
  const row=db.prepare('SELECT payload,revision FROM dashboards WHERE user_id=?').get('owner');const data=JSON.parse(row.payload);data.overrides[id].deadline=deadline;data.overrides[id].deadlineConfirmed=deadlineConfirmed;db.prepare('UPDATE dashboards SET payload=? WHERE user_id=?').run(JSON.stringify(data),'owner');
  const proof={taskId:id,runId:'deadline-guard-test',token:randomUUID(),requestId:randomUUID(),action:'acquire',receipt:'Isolated deadline guard validation.'};const acquired=await call('change_task_claim',proof);const claim={runId:proof.runId,token:proof.token,generation:acquired.data.generation};
  const seen=(await call('get_execution_work')).data.records.tasks.find(t=>t.id===id);assert.equal(seen.deadline,deadline);assert.equal(seen.deadlineConfirmed,deadlineConfirmed);
  assert((await call('clear_obsolete_deadline',{id,revision:row.revision,claim})).isError);
  assert(!(await call('change_task_claim',{...proof,requestId:randomUUID(),generation:claim.generation,action:'release',receipt:'Isolated guard test complete; explicitly released.'})).isError);
 }
 console.log('PASS future and confirmed dates protected; old cleanup cannot hide a new date or confirmation');
 const before=db.prepare('SELECT payload FROM dashboards WHERE user_id=?').get('owner').payload;
 assert((await call('save_task_update',{id,revision:23,status:'Verified complete',notes:'',evidence:'',deadline:'',deadlineConfirmed:false,accepted:false,claim:{runId:'no-approval',token:randomUUID(),generation:1}})).isError);
 assert.equal(db.prepare('SELECT payload FROM dashboards WHERE user_id=?').get('owner').payload,before);
 console.log('PASS original acceptance gate unchanged; unsigned, wrong-holder, stale-revision, injected-approval/status and repeat writes rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
