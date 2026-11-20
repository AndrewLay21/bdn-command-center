const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto').webcrypto;
function loader(overrides={},globals={}){const cache={};function load(file){if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,Error,Date,Intl,Map,Set,Response,Request,URL,AbortSignal,crypto,JSON,...globals,require(id){if(overrides[id])return overrides[id];if(id.endsWith('.css'))return {};if(id.startsWith('@/'))return id.endsWith('.json')?JSON.parse(fs.readFileSync(id.slice(2))):load(id.slice(2)+'.ts');if(id.startsWith('.')){const base=path.join(path.dirname(file),id);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx')}return require(id)}},{filename:file});return exports}return load}
(async()=>{
 let reads=0,writes=0,providers=0,contexts=0,bodies=0;
 const DB={prepare(){reads++;return {bind(){return {first:async()=>({revision:1,payload:JSON.stringify({turns:[{id:'saved',agent:'dex',message:'Saved question',answer:'Saved reply',status:'answered',at:'2026-11-17T12:00:00Z'}]}),updated_at:'2026-11-17'}),run:async()=>{writes++;throw Error('unexpected write')}}}}}};
 const env={DB,DASHBOARD_CHAT_ENABLED:'true',OPENAI_API_KEY:'synthetic',OPENAI_MODEL:'synthetic'};
 const load=loader({'cloudflare:workers':{env},'@/lib/dashboard-chat-context':{async dashboardChatContext(){contexts++;throw Error('unexpected context')}}},{fetch(){providers++;throw Error('unexpected provider')}});
 for(const file of ['app/api/dashboard-chat/route.ts','app/api/dashboard-chat/handoff/route.ts']){
  const api=load(file);
  for(const [auth,origin,status] of [[false,true,401],[true,false,403],[true,true,423]]){
   const r=new Request('https://fixture.invalid/api/dashboard-chat',{method:'POST',headers:{...(auth?{'oai-authenticated-user-id':'synthetic'}:{}),origin:origin?'https://fixture.invalid':'https://other.invalid','content-type':'application/json'},body:'not-json'});
   r.text=async()=>{bodies++;throw Error('body read')};
   const result=await api.POST(r);assert.equal(result.status,status);if(status===423)assert.equal((await result.json()).code,'send_held');
  }
 }
 assert.equal(reads+writes+providers+contexts+bodies,0);
 const history=await load('app/api/dashboard-chat/route.ts').GET(new Request('https://fixture.invalid/api/dashboard-chat?agent=dex',{headers:{'oai-authenticated-user-id':'synthetic'}}));assert.equal(history.status,200);assert.equal((await history.json()).turns[0].answer,'Saved reply');assert.equal(reads,1);
 let slots=[],cursor=0,requests=0;
 const hooks={useState(v){const i=cursor++;if(!(i in slots))slots[i]=v;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef(v){const i=cursor++;return slots[i]??(slots[i]={current:v})},useEffect(){},useCallback(fn){return fn}};
 const Dashboard=loader({react:hooks,'./use-voice-draft':{useVoiceDraft(){return {supported:false,listening:false,note:'',stop(){},toggle(){}}}}},{fetch(){requests++;throw Error('UI network')}})('app/dashboard-chat.tsx').default;
 function all(e){if(!e||typeof e!=='object')return [];const c=e.props?.children;return [e,...(Array.isArray(c)?c.flat(Infinity):[c]).flatMap(all)]}
 const root=Dashboard({active:true,items:[],open(){},navigate(){}}),Agent=all(root).find(e=>e.props?.agent==='dex');
 for(const mode of ['chatgpt','dashboard']){
  slots=[];function render(){cursor=0;return Agent.type({...Agent.props,mode})}
  let t=render();all(t).find(e=>e.type==='textarea').props.onChange({target:{value:'Retain this draft'}});t=render();
  assert.equal(all(t).find(e=>e.props?.className==='dc-send').props.disabled,true);
  all(t).find(e=>e.type==='form').props.onSubmit({preventDefault(){}});
  for(const key of [{key:'Enter',shiftKey:false},{key:'Enter',shiftKey:false,ctrlKey:true},{key:'Enter',shiftKey:true}])all(t).find(e=>e.type==='textarea').props.onKeyDown({...key,nativeEvent:{isComposing:false},preventDefault(){}});
  await new Promise(r=>setImmediate(r));t=render();assert.equal(all(t).find(e=>e.type==='textarea').props.value,'Retain this draft');
 }
 assert.equal(requests,0);assert.equal(writes+providers+contexts+bodies,0);
 console.log('PASS reconstructed hold: both POST auth/origin/423, no body/context/provider/write, GET history retained, both UI modes disabled, submit/Enter blocked, drafts retained. Synthetic only.');
})().catch(e=>{console.error(e);process.exitCode=1});
