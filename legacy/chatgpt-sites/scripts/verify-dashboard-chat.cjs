const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto').webcrypto;
function loader(overrides={},globals={}){const cache={};function load(file){if(cache[file])return cache[file];const exports={};cache[file]=exports;vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,Error,Date,Intl,Map,Set,Response,Request,URL,AbortSignal,crypto,JSON,...globals,require(id){if(overrides[id])return overrides[id];if(id.endsWith('.css'))return {};if(id.startsWith('@/'))return id.endsWith('.json')?JSON.parse(fs.readFileSync(id.slice(2))):load(id.slice(2)+'.ts');if(id.startsWith('.')){const base=path.join(path.dirname(file),id);return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx')}return require(id)}},{filename:file});return exports}return load}
const modelBody={status:'completed',output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'GAP-06 is recorded Done. GAP-999 is not a valid source.'}]}]};
const lib=loader()('lib/dashboard-chat.ts');
assert.match(lib.responseText(modelBody),/GAP-06/);assert.throws(()=>lib.responseText({...modelBody,status:'incomplete'}));
assert.equal(lib.referencedRecords('GAP-06 GAP-999',[{id:'GAP-06',title:'Keys',source:'portfolio'}]).length,1);
const rows=new Map([['portfolio:v1:owner',{revision:5,payload:'{"keep":"unchanged"}',updated_at:'2026-10-28'}]]),original=JSON.stringify(rows.get('portfolio:v1:owner'));
const DB={
 prepare(sql){
  return {bind(...values){
   return {
    async first(){return rows.get(values[0])??null},
    async run(){
     if(sql.startsWith('UPDATE')){
      const [payload,updated_at,key,revision]=values,old=rows.get(key);
      if(!old||old.revision!==revision)return {meta:{changes:0}};
      rows.set(key,{payload,updated_at,revision:revision+1});return {meta:{changes:1}};
     }
     const [key,payload,updated_at]=values;
     if(rows.has(key))return {meta:{changes:0}};
     rows.set(key,{payload,updated_at,revision:1});return {meta:{changes:1}};
    }
   };
  }};
 }
};
const env={DB};let calls=0,fail=false,gate=null,lastInput=null,billingFail=false;
const contextStub={async dashboardChatContext(r){
 assert(r.headers.get('oai-authenticated-user-id'));
 return {context:{saved:'record'},references:[{id:'GAP-06',title:'Keys',source:'portfolio'}],checkedAt:'2026-10-28T20:00:00Z',unavailable:['Daily audit']};
}};
const fetchStub=async(url,options)=>{
 calls++;assert.equal(url,'https://api.openai.com/v1/responses');
 const input=JSON.parse(options.body);lastInput=input;assert.equal(input.store,false);assert(!('tools'in input));assert.equal(input.input.at(-1).role,'user');
 if(gate)await gate;
 if(fail)return Response.json({error:'Provider failure'},{status:500});
 if(billingFail)return Response.json({error:{code:'credit_balance_exhausted',type:'insufficient_quota',message:'sensitive provider diagnostics must not leak'}},{status:429});
 return Response.json(modelBody);
};
const api=loader({'cloudflare:workers':{env},'@/lib/dashboard-chat-context':contextStub},{fetch:fetchStub})('app/api/dashboard-chat/route.ts');
const get=(uid,agent='dex')=>new Request('https://dashboard.test/api/dashboard-chat?agent='+agent,{headers:uid?{'oai-authenticated-user-id':uid}:{}});
const post=(body,uid='owner',origin='https://dashboard.test')=>new Request('https://dashboard.test/api/dashboard-chat',{method:'POST',headers:{'content-type':'application/json',origin,...(uid?{'oai-authenticated-user-id':uid}:{})},body:JSON.stringify(body)});
const message={revision:0,requestId:crypto.randomUUID(),message:'What happened with GAP-06?'};
(async()=>{
 assert.equal((await api.GET(get())).status,401);assert.equal((await api.POST(post(message,null))).status,401);assert.equal((await api.POST(post(message,'owner','https://other.test'))).status,403);
 assert.equal((await api.POST(post(message))).status,503);assert.equal(calls,0);assert.equal((await(await api.GET(get('owner'))).json()).configured,false);
 Object.assign(env,{OPENAI_API_KEY:'test-only-key',OPENAI_MODEL:'test-model',DASHBOARD_CHAT_ENABLED:'true'});
 const first=await(await api.POST(post(message))).json();assert.equal(first.revision,2);assert.equal(first.turns[0].status,'answered');assert.equal(first.turns[0].references.length,1);assert.equal(first.turns[0].unavailable[0],'Daily audit');assert(!JSON.stringify(first).includes('test-only-key'));
 assert.equal((await(await api.POST(post(message))).json()).duplicate,true);assert.equal(calls,1,'Same request must not spend twice');assert.equal((await api.POST(post({...message,message:'Changed'}))).status,409);
 assert.equal((await api.POST(post({...message,requestId:crypto.randomUUID()}))).status,409);assert.equal(calls,1);
 assert.equal((await(await api.GET(get('someone-else'))).json()).turns.length,0,'Visitor histories stay separate');
 fail=true;const failed=await(await api.POST(post({...message,revision:2,requestId:crypto.randomUUID()}))).json();assert.equal(failed.turns[1].status,'error');assert(!failed.turns[1].answer);fail=false;
 let release;gate=new Promise(resolve=>release=resolve);const concurrent={...message,requestId:crypto.randomUUID()};const pending=api.POST(post(concurrent,'other'));await new Promise(resolve=>setTimeout(resolve,10));const duplicate=await api.POST(post(concurrent,'other'));assert.equal(duplicate.status,202);release();await pending;gate=null;assert.equal(calls,3);
 const capped={turns:[],day:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),requests:40};rows.set('chat:v1:limited',{revision:1,payload:JSON.stringify(capped)});assert.equal((await api.POST(post({...message,revision:1,requestId:crypto.randomUUID()},'limited'))).status,429);assert.equal(calls,3);
 assert.equal(JSON.stringify(rows.get('portfolio:v1:owner')),original,'Chat must never mutate task records');
 for(const id of rows.keys())assert(id==='portfolio:v1:owner'||id.startsWith('chat:v1:'));
 console.log('PASS: auth/origin, disabled setup, bounded payload, verified reply save, cross-user isolation, request deduplication, concurrency, provider errors, rate limit and no business writes.');
 // All roles share the same account quota and revision while their histories stay separate.
 assert.equal((await api.GET(get('owner','unlisted'))).status,400);
 assert.equal((await api.POST(post({...message,agent:'unlisted'}))).status,400);
 const ownerBefore=await(await api.GET(get('owner'))).json();
 const mansaMessage={revision:ownerBefore.revision,requestId:crypto.randomUUID(),message:'Organize my creative evidence.',agent:'mansa'};
 const mansa=await(await api.POST(post(mansaMessage))).json();
 assert.equal(mansa.agent,'mansa');assert.equal(mansa.turns.length,1);assert.equal(mansa.turns[0].agent,'mansa');
 assert.match(lastInput.instructions,/Selected dashboard role: Mansa Musa/);assert.match(lastInput.instructions,/not the separate/);
 assert.equal(lastInput.input.filter(x=>x.role==='user').length,1,'Do not include Dex conversation in Mansa prompt');
 const dexAgain=await(await api.GET(get('owner'))).json();assert.equal(dexAgain.turns.length,ownerBefore.turns.length);assert(!dexAgain.turns.some(t=>t.id===mansaMessage.requestId));
 assert.equal((await api.POST(post({...mansaMessage,agent:'drew'}))).status,409,'A duplicate cannot be rerouted to another role');
 const mansaFollow=await(await api.POST(post({...mansaMessage,requestId:crypto.randomUUID(),revision:mansa.revision,message:'What is the next evidence check?'}))).json();
 assert.equal(mansaFollow.turns.length,2);assert.equal(lastInput.input.filter(x=>x.role==='user').length,2,'Use only the selected role history');
 assert.equal((await api.POST(post({...message,agent:'mansa',revision:1,requestId:crypto.randomUUID()},'limited'))).status,429,'Changing roles does not reset the daily cap');
 const legacy={turns:[{id:'legacy',message:'Keep old history',answer:'Saved old answer',at:new Date().toISOString(),status:'answered'}],day:'',requests:0};rows.set('chat:v1:legacy',{revision:1,payload:JSON.stringify(legacy)});
 assert.equal((await(await api.GET(get('legacy','dex'))).json()).turns[0].id,'legacy');assert.equal((await(await api.GET(get('legacy','drew'))).json()).turns.length,0);
 const longHistory=['dex','drew','mansa'].flatMap(agent=>Array.from({length:25},(_,i)=>({id:agent+i,agent,message:'history',at:new Date().toISOString(),status:'answered'})));
 const retained=lib.retainChatTurns(longHistory);assert.equal(retained.length,60);for(const agent of ['dex','drew','mansa']){assert.equal(retained.filter(t=>t.agent===agent).length,20);assert(retained.some(t=>t.id===agent+'24'));assert(!retained.some(t=>t.id===agent+'0'));}
 console.log('PASS: validated role selection, role-specific prompt/history, shared quota, duplicate-role rejection, legacy Dex history and independent retention.');
 env.OPENAI_MODEL='gpt-6-luna';billingFail=true;
 const billing=await(await api.POST(post({...message,requestId:crypto.randomUUID()},'billing-check'))).json();
 assert.equal(billing.turns[0].status,'error');assert.equal(billing.turns[0].errorCode,'billing');assert.match(billing.turns[0].error,/credit balance is empty/);assert(!JSON.stringify(billing).includes('sensitive provider diagnostics'));
 assert.equal(lastInput.reasoning.effort,'none');assert.equal(lastInput.max_output_tokens,1800);
 assert.equal(lib.providerFailure(429,{error:{code:'rate_limit_exceeded'}}).code,'rate_limit');
 assert(!lib.providerFailure(429,{error:{code:'project_spend_limit_exceeded'}}).message.includes('Add API credits'));
 assert.equal(lib.providerFailure(401,{error:{message:'secret'}}).code,'connection');billingFail=false;
 console.log('PASS: actionable credit/usage/rate-limit errors, safe provider diagnostics and explicit Luna output budget.');


 // Exercise real context builder against source handlers, preserving signed-in identity.
 const contextLoad=loader({'@/app/api/portfolio/route':{GET:async r=>{assert.equal(r.headers.get('oai-authenticated-user-id'),'owner');return Response.json({revision:4,items:[{id:'GAP-06',title:'Keys',status:'Done',owner:'Mansa Musa',nextStep:'Keep evidence',proof:'Saved owner evidence',note:'',sourceDate:'2026-10-28'}]})}},'@/app/api/dashboard/route':{GET:async()=>Response.json({tasks:[{id:'DOT-003',title:'Release handoff',status:'Review',owner:'Drew2.0',updated:'2026-10-28',action:'Check latest handoff',notes:'',evidence:''}]})},'@/app/api/daily-audit/route':{GET:async()=>Response.json({error:'unavailable'},{status:503})},'@/app/api/weekly-plan/route':{GET:async()=>Response.json({plan:{timezone:'America/New_York',scope:'simulated'}})}});
 const c=await contextLoad('lib/dashboard-chat-context.ts').dashboardChatContext(get('owner'),'GAP-06');assert.equal(c.context.recordIndex.length,2);assert.equal(c.context.selectedDetails[0].id,'GAP-06');assert.equal(c.unavailable[0],'Daily audit');assert.equal(c.context.weeklyPlan.timezone,'America/New_York');
 console.log('PASS: current saved sources, owner identity, partial-source errors and bounded relevant detail selection.');
 // The no-credit route must read only the caller's sources and never call a model or write history.
 const beforeHandoff=JSON.stringify([...rows]),callsBeforeHandoff=calls;
 let handoffReads=0;
 const handoffApi=loader({'@/lib/dashboard-chat-context':{async dashboardChatContext(r){handoffReads++;assert.equal(r.headers.get('oai-authenticated-user-id'),'owner');return c;}}},{fetch(){throw Error('Handoff must not call any provider');}})('app/api/dashboard-chat/handoff/route.ts');
 const requestHandoff=(body,uid='owner',origin='https://dashboard.test')=>new Request('https://dashboard.test/api/dashboard-chat/handoff',{method:'POST',headers:{origin,'content-type':'application/json',...(uid?{'oai-authenticated-user-id':uid}:{})},body:JSON.stringify(body)});
 const handoffMessage={agent:'mansa',message:'What evidence is missing?'};
 assert.equal((await handoffApi.POST(requestHandoff(handoffMessage,null))).status,401);
 assert.equal((await handoffApi.POST(requestHandoff(handoffMessage,'owner','https://other.test'))).status,403);
 assert.equal((await handoffApi.POST(requestHandoff({...handoffMessage,agent:'unlisted'}))).status,400);
 assert.equal((await handoffApi.POST(requestHandoff({...handoffMessage,message:'x'.repeat(2001)}))).status,400);
 assert.equal((await handoffApi.POST(requestHandoff({...handoffMessage,records:'client spoof'}))).status,400);
 assert.equal(handoffReads,0,'Reject invalid requests before reading records');
 const handoffResponse=await handoffApi.POST(requestHandoff(handoffMessage));assert.equal(handoffResponse.status,200);assert.match(handoffResponse.headers.get('cache-control'),/no-store/);
 const handoffResult=await handoffResponse.json();assert.match(handoffResult.text,/Requested focus: Mansa Musa/);assert.match(handoffResult.text,/What evidence is missing/);assert.match(handoffResult.text,/GAP-06/);assert.match(handoffResult.text,/DOT-003/);assert.match(handoffResult.text,/Daily audit/);assert.match(handoffResult.text,/not automatically saved/);
 assert.equal(calls,callsBeforeHandoff);assert.equal(JSON.stringify([...rows]),beforeHandoff,'Handoff must not write chat quota, history or tasks');
 const handoffLib=loader()('lib/chat-handoff.ts');
 const largeContext={...c.context,recordIndex:Array.from({length:100},(_,i)=>({id:'X'+i,title:'record',status:'Review',owner:'Drew',source:'portfolio',at:'2026-10-28'})),selectedDetails:Array.from({length:20},(_,i)=>({id:'X'+i,title:'record',status:'Review',owner:'Drew',source:'portfolio',at:'2026-10-28',next:'n'.repeat(1000),evidence:'e'.repeat(1000),notes:'t'.repeat(1000)})),weeklyPlan:{huge:'x'.repeat(7000)}};
 const bounded=handoffLib.buildChatHandoff('dex','Help',largeContext);assert.match(bounded,/10 relevant\/recent detailed records and 60 index entries out of 100/);assert.match(bounded,/Weekly plan exceeds/);assert(bounded.length<40000);
 const failedHandoff=loader({'@/lib/dashboard-chat-context':{async dashboardChatContext(){throw Error('database details must not leak');}}})('app/api/dashboard-chat/handoff/route.ts');
 const unavailableHandoff=await failedHandoff.POST(requestHandoff(handoffMessage));assert.equal(unavailableHandoff.status,503);assert(!JSON.stringify(await unavailableHandoff.json()).includes('database details'));
 console.log('PASS: no-credit handoff authentication, same-origin checks, bounded saved context, explicit gaps, no provider requests and no quota/history/task writes.');
 // Exercise the actual frontend submit choice, without a browser or real clipboard.
 let uiSlots=[],uiCursor=0,uiRequests=[],clipboardText='';
 const uiHooks={useState(initial){const i=uiCursor++;if(!(i in uiSlots))uiSlots[i]=initial;return [uiSlots[i],v=>uiSlots[i]=typeof v==='function'?v(uiSlots[i]):v]},useRef(initial){const i=uiCursor++;return uiSlots[i]??(uiSlots[i]={current:initial})},useEffect(){},useCallback(fn){return fn}};
 const uiFetch=async(url,options)=>{uiRequests.push(url);assert.equal(url,'/api/dashboard-chat/handoff');assert.equal(JSON.parse(options.body).agent,'dex');return Response.json(handoffResult)};
 const Dashboard=loader({react:uiHooks,'./use-voice-draft':{useVoiceDraft(){return {supported:false,listening:false,note:'',stop(){},toggle(){}}}}},{fetch:uiFetch,navigator:{clipboard:{async writeText(text){clipboardText=text;}}}})('app/dashboard-chat.tsx').default;
 const root=Dashboard({active:true,items:[],open(){},navigate(){}});
 function allNodes(element){if(!element||typeof element!=='object')return [];const children=element.props?.children;return [element,...(Array.isArray(children)?children.flat(Infinity):[children]).flatMap(allNodes)];}
 const defaultMode=allNodes(root).find(e=>e.props?.['aria-pressed']===true);assert(defaultMode);assert.equal(defaultMode.props.children[1].props.children[0],'Use in ChatGPT');
 const Agent=allNodes(root).find(e=>e.props?.agent==='dex');assert.equal(Agent.props.mode,'chatgpt');uiSlots=[];
 function renderAgent(){uiCursor=0;return Agent.type(Agent.props)}
 let tree=renderAgent();allNodes(tree).find(e=>e.type==='textarea').props.onChange({target:{value:'Which systems are blocked?'}});tree=renderAgent();allNodes(tree).find(e=>e.type==='form').props.onSubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));tree=renderAgent();
 assert.deepEqual(uiRequests,['/api/dashboard-chat/handoff']);assert.equal(clipboardText,'','Preparing must not copy or send automatically');
 const copy=allNodes(tree).find(e=>e.type==='button'&&Array.isArray(e.props.children)&&e.props.children.some(c=>typeof c==='string'&&c.includes('Copy question')));assert(copy);copy.props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.equal(clipboardText,handoffResult.text);
 allNodes(tree).find(e=>e.type==='textarea').props.onChange({target:{value:'A different question'}});tree=renderAgent();assert(!allNodes(tree).some(e=>e.props?.['aria-label']==='Ready for ChatGPT'),'Editing a question invalidates the old export');
 console.log('PASS: ChatGPT mode defaults on, form submit uses only the no-credit route, copy needs a separate click and changed questions invalidate old context.');
 // Mock only the browser speech engine: no audio, permission or live service is used.
 let slots=[],cursor=0,effects=[],draft='My existing words',starts=0,aborts=0,instance;
 const hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial})},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i][j])){slots[i]=deps;effects.push(fn)}}};
 class Recognition{constructor(){instance=this}start(){starts++}abort(){aborts++}stop(){this.onend?.()}}
 const speech=loader({react:hooks},{window:{SpeechRecognition:Recognition},document:{hidden:false,addEventListener(){},removeEventListener(){}},setTimeout:()=>1,clearTimeout(){}})('app/use-voice-draft.ts');
 function render(active=true){cursor=0;const v=speech.useVoiceDraft(draft,x=>draft=x,active);const run=effects;effects=[];run.forEach(fn=>fn());return v}
 let voice=render();voice=render();assert.equal(starts,0,'No microphone before an explicit click');voice.toggle();assert.equal(starts,1);instance.onresult({results:[[{transcript:'and a question'}]]});assert.equal(draft,'My existing words and a question');voice=render();assert(voice.listening);voice.toggle();voice=render();assert(!voice.listening);voice.toggle();render(false);assert(aborts>=2);assert.match(speech.voiceError('not-allowed'),/denied/);
 console.log('PASS: explicit microphone start, existing draft preserved, transcript review, stop/navigation cleanup and denied-access guidance.');
})().catch(e=>{console.error(e);process.exitCode=1});
