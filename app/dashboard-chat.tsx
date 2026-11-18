'use client';
import {DASHBOARD_CHAT_SEND_HELD,DASHBOARD_CHAT_HOLD_NOTICE} from '@/lib/dashboard-chat-hold';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2,Clock3,Copy,FileText,LockKeyhole,MessageSquare,Mic,RefreshCw,Send,Square,Volume2} from 'lucide-react';
import type {ChatFeed,ChatReference} from '@/lib/dashboard-chat';
import {chatAgents,chatAgentIds,type ChatAgentId} from '@/lib/chat-agents';
import type {PortfolioItem} from '@/lib/portfolio-types';
import {useVoiceDraft} from './use-voice-draft';
import './dashboard-chat.css';
import TaskTickets,{type TaskCompose} from './task-tickets';
const format=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))+' ET';
type Props={active:boolean;home?:boolean;items:PortfolioItem[];open:(item:PortfolioItem)=>void;navigate:(section:string)=>void};
type ReplyMode='chatgpt'|'dashboard';
type Handoff={text:string;checkedAt:string;unavailable:string[];question:string};
export default function DashboardChat(props:Props){
 const [compose,setCompose]=useState<TaskCompose>();
 const assign=(agent:string,text:string)=>setCompose({id:crypto.randomUUID(),agent,text});
 const [selected,setSelected]=useState<ChatAgentId>('dex');
 const [mode,setMode]=useState<ReplyMode>('chatgpt');
 const profile=chatAgents[selected];
 const sending=useRef(false);
 return <section hidden={!props.active} className={props.home?'dc-shell dc-home':'dc-shell'} aria-label={props.home?'Agent chats':'Dashboard Chat'}>
  {props.home?<p className="dc-home-note">These chats use saved Command Center records and API credits. Each is a dashboard role, not a direct connection to the external agent. Use “Assign task” to turn your draft into a saved assignment without API credits. Agent assignments and results are in <a href="/records">Work records</a>.</p>:<>
  <div className="dc-agent-picker"><img src={profile.avatar} alt=""/><div className="dc-agent-choice"><label htmlFor="dashboard-agent">Choose an agent role</label><select id="dashboard-agent" value={selected} onChange={e=>setSelected(e.target.value as ChatAgentId)}>{chatAgentIds.map(id=><option value={id} key={id}>{chatAgents[id].name}</option>)}</select><span>{profile.subtitle}</span></div><span className="dc-role-badge">Dashboard role</span></div>
  <p className="dc-role-note">Choose a focus for your question. These dashboard roles are not connected to your separate Drew 2.0, Muse or Codex conversations.</p>
  <div className="dc-mode-picker" role="group" aria-label="Where to get your reply"><button type="button" aria-pressed={mode==='chatgpt'} onClick={()=>setMode('chatgpt')}><MessageSquare size={17}/><span>Use in ChatGPT<small>No API credits needed</small></span></button><button type="button" aria-pressed={mode==='dashboard'} onClick={()=>setMode('dashboard')}><Send size={17}/><span>Reply in dashboard<small>Uses API credits</small></span></button></div>
  </>}
  <div className={props.home?'dc-home-grid':undefined}>{chatAgentIds.map(agent=><AgentConversation assign={assign} key={agent} {...props} agent={agent} sending={sending} mode={props.home?'dashboard':mode} active={props.active&&(props.home||selected===agent)}/>)}</div>
  {props.home&&<section className="dc-team"><h2>Who handles what</h2><p>One owner per result. Reuse the existing ticket before creating another. Assignments do not spend model credits or trigger an external worker.</p><div className="dc-team-grid">
   <article><h3>Drew 2.0</h3><p>Editorial, magazine checks, research and production handoffs. Existing scheduled pull; unattended task selection still needs verification.</p></article>
   <article><h3>Dex the Best</h3><p>Engineering, website repairs, integrations and tests. Preserve Kev’s engineering ownership.</p></article>
   <article><h3>Mansa Musa</h3><p>Approved social publishing, queue checks, community work and publication receipts. Use Zeus’s YouTube schedule; do not repeat his channel audit.</p></article>
   <article><h3>Zeus</h3><p>YouTube audit, channel optimization and posting-plan handoff. Coach reports this work is underway. Direct Grok dispatch and saved receipts are not verified here.</p><button type="button" onClick={()=>assign('Zeus','')}>Assign task to Zeus</button></article>
  </div><p>Coach Drew owns strategy and final releases. Existing rights, factual, publishing and spending holds remain in force.</p></section>}
  <TaskTickets items={props.items} compose={compose} compact/>
 </section>;
}
function AgentConversation({active,items,open,navigate,agent,mode,home,sending,assign}:Props&{assign:(agent:string,text:string)=>void;agent:ChatAgentId;mode:ReplyMode;sending:{current:boolean}}){
 const profile=chatAgents[agent];
 const draftId='dashboard-chat-draft-'+agent,voiceNoteId='dashboard-chat-voice-note-'+agent;
 const [feed,setFeed]=useState<ChatFeed|null>(null),[draft,setDraft]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[speaking,setSpeaking]=useState(''),[canSpeak,setCanSpeak]=useState(false);
 const [handoff,setHandoff]=useState<Handoff|null>(null),[preparing,setPreparing]=useState(false),[handoffError,setHandoffError]=useState(''),[copyNote,setCopyNote]=useState('');
 const handoffInput=useRef<HTMLTextAreaElement>(null),preparingRef=useRef(false);
 const manual=mode==='chatgpt',currentHandoff=handoff?.question===draft.trim()?handoff:null;
 const busyRef=useRef(false),input=useRef<HTMLTextAreaElement>(null),messages=useRef<HTMLDivElement>(null),mounted=useRef(true),pendingMessage=useRef<{id:string;message:string}|null>(null);
 const voice=useVoiceDraft(draft,setDraft,active);
 useEffect(()=>{setCopyNote('');setHandoffError('');},[draft]);
 const load=useCallback(async()=>{setLoading(true);try{const r=await fetch('/api/dashboard-chat?agent='+agent,{cache:'no-store'});const data=await r.json() as ChatFeed&{error?:string};if(!r.ok)throw Error(data.error||'Chat could not be loaded.');if(mounted.current){setFeed(current=>!current||data.revision>=current.revision?data:current);setError('');const pending=pendingMessage.current;if(pending&&data.turns.some(t=>t.id===pending.id)){setDraft(current=>current===pending.message?'':current);pendingMessage.current=null;}}return data;}catch(e){if(mounted.current)setError((e as Error).message);return null;}finally{if(mounted.current)setLoading(false)}},[agent]);
 useEffect(()=>{mounted.current=true;setCanSpeak('speechSynthesis'in window);return()=>{mounted.current=false;window.speechSynthesis?.cancel()}},[]);
 useEffect(()=>{if(active&&!manual)void load();else{window.speechSynthesis?.cancel();setSpeaking('')}},[active,manual,load]);
 useEffect(()=>{voice.stop();window.speechSynthesis?.cancel();setSpeaking('');},[mode]);
 const pending=feed?.turns.some(t=>t.status==='pending'&&Date.now()-Date.parse(t.at)<90000);
 useEffect(()=>{if(!active||manual||!pending||busy)return;const timer=setInterval(()=>void load(),5000);return()=>clearInterval(timer)},[active,manual,pending,busy,load]);
 useEffect(()=>{if(active&&!manual&&(feed?.turns.length||busy)&&messages.current)messages.current.scrollTop=messages.current.scrollHeight},[feed?.revision,busy,active,manual]);
 const pick=(text:string)=>{if(voice.listening||busyRef.current||preparingRef.current)return;setDraft(text);input.current?.focus()};
 async function prepareHandoff(){
  if(DASHBOARD_CHAT_SEND_HELD)return;
  if(preparingRef.current||busyRef.current||!active||voice.listening||!draft.trim())return;
  const question=draft.trim();preparingRef.current=true;setPreparing(true);setHandoffError('');setCopyNote('');setHandoff(null);
  try{const response=await fetch('/api/dashboard-chat/handoff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent,message:question})});const result=await response.json() as Omit<Handoff,'question'>&{error?:string};if(!response.ok)throw Error(result.error||'The context could not be prepared.');if(mounted.current)setHandoff({...result,question});}
  catch(e){if(mounted.current)setHandoffError((e as Error).message);}
  finally{preparingRef.current=false;if(mounted.current)setPreparing(false);}
 }
 async function copyHandoff(){
  if(!currentHandoff)return;
  try{await navigator.clipboard.writeText(currentHandoff.text);setCopyNote('Copied. Paste into this ChatGPT conversation and press Send.');}
  catch{handoffInput.current?.focus();handoffInput.current?.select();setCopyNote('Automatic copy is unavailable in this panel. The text is selected: copy it, then paste into ChatGPT.');}
 }
 async function send(){
  if(DASHBOARD_CHAT_SEND_HELD)return;
  if(manual||preparingRef.current||busyRef.current||loading||pending||!active||voice.listening||!draft.trim()||!feed?.configured)return;
  if(sending.current){setError('Another chat is waiting for a reply. Send this draft after it finishes.');return;}
  const message=draft.trim(),id=crypto.randomUUID();sending.current=true;busyRef.current=true;setBusy(true);setError('');
  try{const latest=await load();if(!latest)return;
   if(!latest.configured)return;
   if(!active)return;
   pendingMessage.current={id,message};
   const r=await fetch('/api/dashboard-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:latest.revision,requestId:id,message,agent})});const data=await r.json() as ChatFeed&{error?:string};if(!r.ok)throw Error(data.error||'The message result was not confirmed.');if(mounted.current){setFeed(data);if(data.turns.some(t=>t.id===id)){setDraft('');pendingMessage.current=null;}}}
  catch(e){if(mounted.current){setError((e as Error).message+' Use “Check saved conversation” before resending.');}}
  finally{sending.current=false;busyRef.current=false;if(mounted.current)setBusy(false)}
 }
 function speak(id:string,text:string){window.speechSynthesis.cancel();if(speaking===id){setSpeaking('');return;}const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.onend=()=>setSpeaking('');utterance.onerror=()=>setSpeaking('');setSpeaking(id);window.speechSynthesis.speak(utterance);}
 function reference(r:ChatReference){const item=items.find(i=>i.id===r.id);return r.source==='portfolio'&&item?<button key={r.id} onClick={()=>open(item)}><FileText size={13}/>{r.id}<ArrowUpRight size={13}/></button>:r.source==='original'?<a key={r.id} href={'/records?task='+encodeURIComponent(r.id)}><FileText size={13}/>{r.id}<ArrowUpRight size={13}/></a>:null;}
 return <div hidden={!active} className="dc-wrap"><div className="dc-layout"><section className="dc-chat" aria-label={profile.name+' conversation'}>
  <header className="dc-header"><img src={profile.avatar} alt=""/><div><strong>{profile.name}</strong><span>{home?profile.subtitle:manual?'ChatGPT handoff · no API credits needed':feed?.configured?'AI connection configured · saved records':feed?'AI connection needed':'Checking connection…'}</span></div><span className="dc-private"><LockKeyhole size={13}/>Private</span></header>
  <div ref={messages} className="dc-messages" role="log" aria-label={profile.name+' messages'} aria-live="polite" aria-relevant="additions text">
   {home&&!feed?.turns.length&&<div className="dc-home-empty"><p>{loading?'Loading conversation…':profile.focus}</p>{!loading&&<button type="button" onClick={()=>pick(profile.suggestions[0])}>{profile.suggestions[0]}</button>}</div>}
   {!home&&(manual||!feed?.turns.length)&&<div className="dc-welcome"><span className="dc-welcome-icon"><MessageSquare size={27}/></span><span className="dc-kicker">A CLEARER NEXT MOVE</span><h2>{manual?'Keep moving, Coach.':'Talk it through, Coach.'}</h2><p>{profile.focus} {manual?'Prepare your question with saved dashboard context, then paste it into your ChatGPT conversation for an answer.':'Type a question or speak, then review your words.'}</p><div className="dc-suggestions">{profile.suggestions.map(s=><button key={s} onClick={()=>pick(s)} disabled={busy||preparing||voice.listening}>{s}<ArrowUpRight size={14}/></button>)}</div></div>}
   {!manual&&feed?.turns.map(t=><div className="dc-turn" key={t.id}><div className="dc-user"><span>You · {format(t.at)}</span><p>{t.message}</p></div><div className="dc-answer"><span className="dc-answer-label">{profile.name} · DASHBOARD ROLE</span>{t.status==='answered'?<><p>{t.answer}</p>{!!t.references?.length&&<div className="dc-references" aria-label="Referenced records">{t.references.map(reference)}</div>}<footer><span><CheckCircle2 size={12}/> Saved reply · records read {t.checkedAt?format(t.checkedAt):'date unavailable'}</span>{canSpeak&&<button onClick={()=>speak(t.id,t.answer!)} aria-label={speaking===t.id?'Stop reading reply':'Read reply aloud'}>{speaking===t.id?<Square size={14}/>:<Volume2 size={14}/>} {speaking===t.id?'Stop':'Listen'}</button>}</footer>{!!t.unavailable?.length&&<small>Unavailable sources: {t.unavailable.join(', ')}.</small>}</>:<p className={t.status==='error'?'dc-message-error':''}>{t.status==='error'?t.error:Date.now()-Date.parse(t.at)<90000?'Reading your saved records and preparing a reply…':'A reply was not confirmed. Check the saved conversation before sending again.'}</p>}{t.status==='error'&&<div className="dc-references">{t.errorCode==='billing'&&<a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer">Open API billing <ArrowUpRight size={13}/></a>}<button type="button" onClick={()=>pick(t.message)} disabled={busy||preparing||voice.listening}>Use this question again</button></div>}</div></div>)}
   {busy&&<p className="dc-busy" role="status">Checking your records…</p>}
  </div>
  {manual?<div className="dc-connection dc-handoff-note"><strong>Your existing ChatGPT conversation can help now.</strong><p>This prepares text only and makes no paid API request. You choose when to paste and send it. ChatGPT’s usual plan limits apply; replies stay in ChatGPT.</p></div>:feed&&!feed.configured&&<div className="dc-connection"><strong>One connection step remains.</strong><p>AI replies need a secure OpenAI connection. You can prepare a typed or dictated draft now. Send becomes available after setup.</p></div>}
  {!manual&&error&&<div className="dc-error" role="alert">{error} {home&&<button type="button" onClick={()=>void load()} disabled={loading||busy}>Check saved conversation</button>}</div>}
  {DASHBOARD_CHAT_SEND_HELD&&<p className="dc-connection" role="status">{DASHBOARD_CHAT_HOLD_NOTICE}</p>}
  <form className="dc-composer" onSubmit={e=>{e.preventDefault();void (manual?prepareHandoff():send())}}><label htmlFor={draftId}>Question with {profile.name} focus</label><textarea ref={input} id={draftId} value={draft} maxLength={2000} readOnly={voice.listening||busy||preparing} onChange={e=>setDraft(e.target.value)} rows={3} placeholder="What should I focus on next?" aria-describedby={voiceNoteId} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void (manual?prepareHandoff():send())}}}/><div className="dc-compose-controls"><button className={'dc-mic '+(voice.listening?'listening':'')} type="button" onClick={voice.toggle} disabled={!voice.supported||busy||preparing} aria-pressed={voice.listening} aria-label={voice.listening?'Stop dictation':'Start voice dictation'}>{voice.listening?<Square size={16}/>:<Mic size={17}/>} {voice.listening?'Stop dictation':'Speak'}</button><button type="button" disabled={busy||preparing||voice.listening} onClick={()=>assign(agent==='drew'?'Drew2.0':profile.name,draft.trim())}>Assign task</button><span>{draft.length}/2,000</span><button className="dc-send" type="submit" disabled={DASHBOARD_CHAT_SEND_HELD||busy||preparing||voice.listening||!draft.trim()||(!manual&&(!feed?.configured||loading||pending))}>{manual?<MessageSquare size={16}/>:<Send size={16}/>} {manual?(preparing?'Preparing…':'Use in ChatGPT'):(busy?'Sending…':'Send')}</button></div><p id={voiceNoteId} className="dc-voice-note" role="status">{voice.note||(!voice.supported?'Type your message; voice dictation is unavailable in this browser.':'Speak uses your browser’s speech service, which may process audio online. Review the transcript before sending.')} {!home&&<a href="/#dashboard-chat" target="_blank" rel="noopener noreferrer">Open full page</a>}</p></form>
  {manual&&handoffError&&<div className="dc-error" role="alert">{handoffError}</div>}
  {manual&&currentHandoff&&<section className="dc-handoff" aria-label="Ready for ChatGPT"><h3>Your question is ready to copy.</h3><p>Includes your question, selected focus and a limited snapshot of saved records checked {format(currentHandoff.checkedAt)}. Review the text, copy it, then paste into this ChatGPT conversation.</p>{!!currentHandoff.unavailable.length&&<p className="dc-message-error">Unavailable sources: {currentHandoff.unavailable.join(', ')}.</p>}<label htmlFor={'handoff-'+agent}>Question and saved context</label><textarea id={'handoff-'+agent} ref={handoffInput} value={currentHandoff.text} readOnly rows={7}/><div className="dc-handoff-actions"><button type="button" onClick={()=>void copyHandoff()}><Copy size={16}/> Copy question & context</button><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT <ArrowUpRight size={15}/></a></div><p role="status">{copyNote||'Nothing is sent automatically. You can keep using the ChatGPT conversation you already have open.'}</p></section>}
 </section>{!home&&<aside className="dc-guide"><span className="dc-kicker">YOUR DASHBOARD, IN CONVERSATION</span><h3>Ask. Understand.<br/>Choose your next step.</h3><p>Answers use your saved records. Source dates help you see how current the information is.</p><div className="dc-guide-item"><FileText size={19}/><div><strong>Find the right record</strong><p>Open a cited task to see its evidence or make an update.</p></div></div><div className="dc-guide-item"><Mic size={19}/><div><strong>Speak, then review</strong><p>Your words appear in the message box. Nothing sends automatically.</p></div></div><div className="dc-guide-item"><LockKeyhole size={19}/><div><strong>You control changes</strong><p>Chat answers questions. Updates use the record editor; agent handoffs and publishing keep their existing controls.</p></div></div><div className="dc-shortcuts"><button onClick={()=>navigate('Next Steps')}>Open Next Steps <ArrowUpRight size={14}/></button><button onClick={()=>navigate('Weekly Schedule')}>View protected schedule <Clock3 size={14}/></button>{!manual&&<button onClick={()=>void load()} disabled={busy||loading}><RefreshCw size={14}/> {loading?'Checking…':'Check saved conversation'}</button>}</div><p className="dc-retention">ChatGPT handoffs stay in this page until you copy them. ChatGPT replies are not synced back here. Dashboard AI mode saves the latest 20 exchanges per role, with a shared 40-message daily limit. Reloading clears unsent drafts and prepared handoffs; task evidence stays in its original record.</p></aside>}</div></div>;
}
