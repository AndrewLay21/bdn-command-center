'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,ArrowUpRight,Check,CheckCircle2,ChevronDown,Clock3,FileCheck2,Flag,CalendarDays,ArrowDown,BookOpen} from 'lucide-react';
import type {PortfolioData,PortfolioItem} from '@/lib/portfolio-types';
import {agentWork,isRecordedDone,teamRecords,type SavedTask,type TeamRecord,type AgentId} from '@/lib/team-overview';
import './team-overview.css';
import PublishingBrief from './publishing-brief';
import PublicationReceipts from './publication-receipts';
import WorkTriage from './work-triage';
import RecordFinder from './record-finder';
import RecordInspector from './record-inspector';
import EditorialBrief from './editorial-brief';
import EngineeringBrief from './engineering-brief';
import EvidenceLadder from './evidence-ladder';
import SourceTrail from './source-trail';
import HandoffMap from './handoff-map';

const social='https://docs.google.com/spreadsheets/d/1-OPfijz0T4wqUUbnwIv6-48ygtjH--1IhzhSLNJ9ey8/edit';
const magazine='https://docs.google.com/spreadsheets/d/1Rpj7eEVN-RKF0SfrpbexhaHwsirJp5KieATjfXAcf20/edit';
const agents=[
  {id:'drew' as AgentId,name:'Drew 2.0',role:'Editorial & production coordination',image:'/images/drew-2-avatar-v1.png',initials:'D2',focus:'Build the complete Southwest Florida magazine proof.',next:'Carry the approved design into a regional cover and one updated full issue.',source:magazine,sourceLabel:'Magazine production sheet'},
  {id:'mansa' as AgentId,name:'Mansa Musa',role:'Muse agent · publishing & evidence',image:'/images/mansa-avatar-v1.png',initials:'MM',focus:'Execute the approved social release handoff.',next:'Instagram route and scheduling receipts are on file. Keep collecting live receipts for the remaining approved placements.',source:social,sourceLabel:'Social approval registry'},
  {id:'dex' as AgentId,name:'Dex the Best',role:'Codex · development & systems',image:'/images/dex-the-best-avatar-v1.png',initials:'DX',focus:'Build your Command Center, one clear phase at a time.',next:'Review the home and agent cards, then refine the Next Steps screen in the next design phase.',source:'/records',sourceLabel:'Original task records',receipt:'Direction received in this conversation. Existing Codex records appear below.'}
];
const formatDate=(v:string)=>{const date=new Date(v);return Number.isNaN(date.getTime())?'Date not recorded':new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric',...(v.includes('T')?{hour:'numeric' as const,minute:'2-digit' as const}:{timeZone:'UTC'})}).format(date)+(v.includes('T')?' ET':'')};

export default function TeamOverview({data,refreshKey,open,navigate,showDone}:{data:PortfolioData;refreshKey:number;open:(i:PortfolioItem)=>void;navigate:(name:string)=>void;showDone:()=>void}) {
  const [tasks,setTasks]=useState<SavedTask[]>([]),[taskError,setTaskError]=useState(''),[loaded,setLoaded]=useState(false),[selected,setSelected]=useState<TeamRecord|null>(null);
  const [reading,setReading]=useState(false);
  const [readAt,setReadAt]=useState('');
  const [agentFilter,setAgentFilter]=useState<AgentId|'all'>('all');
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  useEffect(()=>{let active=true;fetch('/api/dashboard',{cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('The original task records could not refresh.');const body=await response.json() as {tasks:SavedTask[]};if(!Array.isArray(body.tasks))throw Error('Original task response was incomplete.');if(active){setTasks(body.tasks);setLoaded(true);setReadAt(new Date().toISOString());setTaskError('')}}).catch(error=>{if(active)setTaskError(error.message)});return()=>{active=false}},[refreshKey]);
  const records=teamRecords(data.items,tasks);
  const completed=records.filter(isRecordedDone);
  const decisions=tasks.filter(t=>t.kind==='decision'&&!['Approved','Verified complete'].includes(t.status));
  const view=(record:TeamRecord)=>{if(record.source==='portfolio'){const item=data.items.find(i=>i.id===record.id);if(item)open(item)}else setSelected(record)};
  const [todayAgent,setTodayAgent]=useState<AgentId>('drew');
  const [detailsOpen,setDetailsOpen]=useState(false);
  useEffect(()=>{
    const revealLinkedReport=()=>{
      const hash=window.location.hash.slice(1);
      if(!hash||!document.getElementById(hash)?.closest('.today-details'))return;
      setDetailsOpen(true);
      requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView());
    };
    revealLinkedReport();
    window.addEventListener('hashchange',revealLinkedReport);
    return()=>window.removeEventListener('hashchange',revealLinkedReport);
  },[]);
  const agentResults=agentWork(records,todayAgent);
  const blocked=records.filter(r=>['Blocked','Waiting'].includes(r.status)).sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0));
  const latest=data.savedAt?formatDate(data.savedAt):'Imported history';
  function recordRow(record:TeamRecord,done=false){return <button key={record.id} className="to-record" onClick={()=>view(record)}><span className={'to-record-icon '+(done?'done':'')} >{done?<Check size={15}/>:<ArrowRight size={15}/>}</span><span><strong>{record.title}</strong><small>{record.id} · {record.status} · {formatDate(record.at)}</small></span><ArrowUpRight size={14}/></button>}
  return <div className={"to-overview "+(reading?"ux-reading":"")} id="command-brief-top">
    <div className="today-grid">
      <section className="today-panel" aria-labelledby="today-decisions">
        <h2 id="today-decisions">Needs your decision</h2>
        {taskError?<p role="status">Decision records could not refresh. Open the work records to check.</p>:!loaded?<p>Loading decisions…</p>:decisions.length?decisions.slice(0,3).map(task=><a className="today-decision" key={task.id} href={`/records?task=${encodeURIComponent(task.id)}`}><span>{task.title}<small>{task.id} · {task.status}</small></span><ArrowUpRight size={16}/></a>):<p>No open decisions in the saved records.</p>}
        <a className="today-link" href="/records?view=decisions">Open decision board <ArrowRight size={15}/></a>
      </section>
      <section className="today-panel today-agents" aria-labelledby="today-agents">
        <h2 id="today-agents">Agent results</h2>
        <div className="today-agent-picker" role="group" aria-label="Choose an agent">{agents.map(agent=><button key={agent.id} aria-pressed={todayAgent===agent.id} onClick={()=>setTodayAgent(agent.id)}>{agent.name}</button>)}</div>
        <p className="today-meta">{taskError?'Original records could not refresh. Some results may be missing.':!loaded?'Loading original task records…':'Saved task updates and evidence. To verify a run, look for a new result on the assigned ticket.'}</p>
        <h3>Latest completed with evidence</h3>
        {agentResults.completed.length?recordRow(agentResults.completed[0],true):<p>{loaded&&!taskError?'No completion with evidence found for this agent.':'Checking available records…'}</p>}
        <h3>Assigned work</h3>
        {agentResults.current.length?agentResults.current.slice(0,2).map(r=>recordRow(r)):<p>{loaded&&!taskError?'No open assignment found for this agent.':'Checking available records…'}</p>}
        {agentResults.reported.length>0&&<><h3>Reported complete · needs verification</h3>{recordRow(agentResults.reported[0])}</>}
        <a className="today-link" href="/records">Open work records <ArrowRight size={15}/></a>
      </section>
      <section className="today-panel" aria-labelledby="today-blocked">
        <h2 id="today-blocked">Blocked or waiting</h2>
        {taskError&&<p role="status">Original records could not refresh.</p>}
        {blocked.length?blocked.slice(0,3).map(r=>recordRow(r)):<p>{loaded&&!taskError?'No blocked or waiting work in the saved records.':'Checking available records…'}</p>}
      </section>
    </div>
    <details className="today-details" open={detailsOpen} onToggle={event=>setDetailsOpen(event.currentTarget.open)}>
      <summary>Detailed reports and history</summary>
    <nav className="ux-section-nav" aria-label="Command brief sections">{[["work-triage","Attention"],["team-workspaces","Team"],["publishing-brief","Publishing"],["editorial-brief","Editorial"],["approval-desk","Decisions"]].map(([id,label])=><a key={id} href={`#${id}`}>{label}</a>)}<a href="#command-brief-top" aria-label="Back to command brief top">↑</a></nav>
    <div className="ux-view-controls"><div><strong>Your brief, your reading pace.</strong><span>Switch to larger text and a single-column review.</span></div><button aria-pressed={reading} onClick={()=>setReading(!reading)}>{reading?'Return to overview layout':'Open reading mode'} ↗</button></div>
    <details className="ux-freshness"><summary><span className={'ux-state-dot '+(taskError?'warning':'')}/><strong>{taskError?'Saved-data refresh needs attention':loaded?'Saved records loaded':'Loading saved records'}</strong><span>{readAt?`Read ${formatDate(readAt)}`:'Waiting for response'} · inspect sources</span></summary><div className="ux-source-grid"><div><strong>Original task records</strong><p>{taskError||'Read from the existing Command Center API. Refresh above fetches saved records; it does not run agents.'}</p><a href="/records">Open records ↗</a></div><div><strong>Portfolio</strong><p>Last saved: {latest}. Its timestamp can differ from original tasks.</p><button className="to-text-link" onClick={()=>navigate('All My Work')}>View portfolio →</button></div><div><strong>Publishing snapshot</strong><p>Registry rows 72–86 read October 30, 2026. Native queue check attributed to Mansa on October 29, 10:55–11:03 PM ET.</p><a href={social} target="_blank" rel="noopener noreferrer">Check current Registry ↗</a></div></div></details>
    <section className="to-welcome to-mission" aria-label="Your command center at a glance">
      <div><span className="to-kicker">COACH DREW / COMMAND BRIEF</span><h2>Lead with clarity.<br/><em>Move with proof.</em></h2><p>Your team’s saved work, the decisions that need you, and the evidence behind every next step.</p><div className="to-mission-actions"><button onClick={()=>document.getElementById('team-workspaces')?.scrollIntoView({behavior:'smooth'})} className="to-gold-button">Review my team <ArrowDown size={16}/></button><a href="/records?view=decisions">Open founder decisions ↗</a></div></div>
      <div className="to-welcome-note"><span className="to-kicker">SAVED WORK · NOT LIVE ACTIVITY</span><div className="to-mission-number"><strong>{loaded?records.filter(r=>r.status==='Blocked').length:'—'}</strong><span>records marked blocked</span></div><p>{loaded?'Open the record to see its latest evidence and next action.':'Loading original records before presenting totals.'}</p><a href="/records">Review the work board ↗</a><button onClick={()=>navigate('Weekly Schedule')}>Protected mornings · 8 AM–noon ET <ArrowRight size={15}/></button></div>
    </section>
    <div className="to-summary">
      <button onClick={()=>document.getElementById('approval-desk')?.scrollIntoView({behavior:'smooth'})}><span className="to-summary-icon amber"><Flag size={20}/></span><span><strong>Your decisions</strong><small>Approvals, questions & open gates</small></span><ArrowRight size={17}/></button>
      <button onClick={()=>document.getElementById('team-workspaces')?.scrollIntoView({behavior:'smooth'})}><span className="to-summary-icon sage"><BookOpen size={20}/></span><span><strong>{agents.length} agent workspaces</strong><small>Current focus & saved results</small></span><ArrowRight size={17}/></button>
      <button onClick={()=>document.getElementById('recent-results')?.scrollIntoView({behavior:'smooth'})}><span className="to-summary-icon green"><CheckCircle2 size={20}/></span><span><strong>{completed.length} recorded done</strong><small>{loaded?'Across connected task records':'Portfolio only · loading original tasks'}</small></span><ArrowRight size={17}/></button>
    </div>
    <RecordFinder records={records} view={view}/>
    <WorkTriage records={records} loaded={loaded} view={view}/>
    <PublicationReceipts/>
    <PublishingBrief/>
    <div className="to-section-heading" id="team-workspaces"><div><span className="to-kicker">YOUR WORK, WITH CLEAR OWNERS</span><h2>Your agent workspaces</h2></div><span className="to-data-note"><Clock3 size={14}/> Saved updates · no live activity feed</span></div>
    {taskError&&<p className="to-error" role="alert">{taskError} {loaded?'Previously loaded original records may be stale.':'Original task totals are unavailable.'} Use Refresh above to retry.</p>}
    <div className="to-agent-switch" role="group" aria-label="Choose agent workspace"><button aria-pressed={agentFilter==='all'} onClick={()=>setAgentFilter('all')}>Whole team</button>{agents.map(a=><button key={a.id} aria-pressed={agentFilter===a.id} onClick={()=>setAgentFilter(a.id)}><img src={a.image} alt=""/>{a.name}</button>)}</div>
    <div className={'to-agent-grid '+(agentFilter!=='all'?'to-single-agent':'')}>{agents.filter(a=>agentFilter==='all'||a.id===agentFilter).map(agent=>{const work=agentWork(records,agent.id);return <article className={'to-agent '+agent.id} key={agent.id}>
      <header className="to-agent-header"><div className="to-portrait"><span aria-hidden="true">{agent.initials}</span><img src={agent.image} alt={`${agent.name} illustrated AI avatar`} width={100} height={100} onError={e=>{e.currentTarget.style.display='none'}}/></div><div><span className="to-kicker">YOUR AI TEAM</span><h3>{agent.name}</h3><p>{agent.role}</p></div></header>
      <div className="to-agent-body"><div className="to-focus"><span className="to-window-label"><span className="to-small-square"/> Current focus</span><h4>{agent.focus}</h4><p>{agent.next}</p><span className="to-assignment-note">{agent.id==='mansa'?'Registry receipts · Oct 29, 2026':'Standing direction · consult current records below'}<br/>{agent.id==='mansa'?'IG route: row 72 · scheduled handoff: row 73 · BDN-039-IG publication: row 78. This is saved evidence, not a live platform check.':agent.receipt??'See the dated task evidence below for subsequent work.'}</span></div>
      {agent.id==='mansa'&&<div className="to-operator"><strong>Assigned operator · A01/A02</strong><p>DOT-003 remains owned by Drew 2.0 as coordinator. Mansa operates publishing and reconciliation.</p><a href="/records?task=DOT-003">Open the shared handoff ↗</a><a href="https://www.instagram.com/p/DfFVSTPD4AV/" target="_blank" rel="noopener noreferrer">BDN-039-IG · publication receipt ↗</a></div>}
      <section className="to-task-window" aria-label={`${agent.name} current tasks`}><div className="to-window-label"><Clock3 size={14}/> Owned task records <span>{work.current.length}</span></div>{work.current.length?work.current.slice(0,expanded[agent.id]?undefined:1).map(r=>recordRow(r)):<p className="to-empty">{!loaded&&agent.id!=='mansa'?'Loading saved task records…':'No active owned record is matched here. Operator assignments can sit on coordinator-owned records.'}</p>}{work.current.length>1&&<button className="to-expand" aria-expanded={!!expanded[agent.id]} onClick={()=>setExpanded({...expanded,[agent.id]:!expanded[agent.id]})}>{expanded[agent.id]?'Show less':`Show ${work.current.length-1} more saved tasks`}<ChevronDown size={14}/></button>}</section>
      <section className="to-task-window to-completed-window" aria-label={`${agent.name} completed tasks`}><div className="to-window-label"><CheckCircle2 size={15}/> Completed with evidence <span>{work.completed.length}</span></div>{work.completed.length?work.completed.slice(0,expanded[agent.id+'done']?undefined:2).map(r=>recordRow(r,true)):<p className="to-empty">No verified completion is attached to this name in the connected records yet.</p>}{work.completed.length>2&&<button className="to-expand" aria-expanded={!!expanded[agent.id+'done']} onClick={()=>setExpanded({...expanded,[agent.id+'done']:!expanded[agent.id+'done']})}>{expanded[agent.id+'done']?'Show less':'Show all completed tasks'}<ChevronDown size={14}/></button>}
      {(work.reported.length>0||work.approved.length>0)&&<details className="to-qualified"><summary>{work.reported.length} reported complete · {work.approved.length} approved items</summary><p>Reported results still need verification. An approval alone does not prove publication or completion.</p>{[...work.reported,...work.approved].map(r=>recordRow(r))}</details>}</section></div>
      <footer><a href={agent.source} target="_blank" rel="noopener noreferrer">{agent.sourceLabel}<ArrowUpRight size={15}/></a><small>Open the source for the latest handoff</small></footer>
    </article>})}</div>
    <HandoffMap/>
    <EditorialBrief/>
    <EngineeringBrief records={records} view={view}/>
    <EvidenceLadder/>
    <SourceTrail/>
    <div className="to-bottom-grid">
      <section className="to-desk" id="approval-desk"><div className="to-section-heading"><div><span className="to-kicker">WHERE YOU COME IN</span><h2>Your decision desk</h2></div><Flag size={21}/></div>
        <div className="ux-decision-brief"><span className="to-kicker">YOUR CALL / EXISTING RECORDS</span><strong>{loaded?decisions.length:'—'}</strong><h3>{!loaded?'Checking saved decisions':decisions.length?'Decisions to review':'No unresolved decisions in the loaded original records'}</h3><p>Approval gates and operational blockers can still remain. Review the linked evidence before changing a decision.</p><a href="/records?view=decisions">Go to the founder decision board ↗</a></div>
        <details className="ux-approved-history"><summary>Previously approved & resolved · October 28</summary>        <div className="to-approved"><span className="to-status good"><Check size={13}/> Already approved</span><h3>The creative direction can move forward.</h3><p>Magazine designs and layouts are approved. The cover should represent Southwest Florida as a whole. Routine social release timing is delegated; existing content and safety holds remain.</p><div className="to-source-links"><a href={magazine} target="_blank" rel="noopener noreferrer">Magazine approval <ArrowUpRight size={13}/></a><a href={social} target="_blank" rel="noopener noreferrer">Social approvals <ArrowUpRight size={13}/></a></div><small>Founder decisions saved October 28, 2026 · linked sources hold subsequent updates.</small></div>
        <div className="to-approved"><span className="to-status good"><Check size={13}/> Resolved</span><h3>Your morning schedule is decided.</h3><p>Monday’s Man to Man is not happening. Wednesday radio recording at 10 AM Eastern remains the standing exception to TradeLab. Both items are off your unresolved list.</p><small>Founder decision · October 28, 2026</small><button className="to-text-link" onClick={()=>navigate('Weekly Schedule')}>View the saved schedule <ArrowRight size={15}/></button></div>
</details>
        {decisions.length>0&&<div className="to-decision"><h3>{decisions.length} open decisions in original records</h3>{decisions.map(task=><a className="to-decision-link" key={task.id} href={`/records?task=${encodeURIComponent(task.id)}`}>{task.title}<ArrowUpRight size={14}/></a>)}</div>}
        <a className="to-text-link to-approval-link" href="/records?view=decisions">Review founder decision records <ArrowUpRight size={15}/></a>
      </section>
      <div className="to-right-stack"><section className="to-next"><span className="to-kicker">YOUR NEXT MILESTONE</span><span className="to-status neutral">Waiting for evidence</span><h2>One chart. One clear lesson.</h2><p>Obtain the actual October 28 screenshots and candle table for the 10:30 AM–noon GBP/JPY review. Then build one visual lesson and a buy / sell / sit-out exercise.</p><small>210.460 is a historical level. All practice stays simulated.</small><button className="to-dark-button" onClick={()=>{const task=data.items.find(i=>i.id==='GAP-53');if(task)open(task);else navigate('Next Steps')}}>Open TradeLab’s next step <ArrowRight size={16}/></button></section>
      <section className="to-results" id="recent-results"><div className="to-section-heading"><div><span className="to-kicker">KEEP THE PROOF</span><h2>Recently recorded done</h2></div><FileCheck2 size={21}/></div>{completed.length?completed.sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0)).slice(0,3).map(r=>recordRow(r,true)):<p className="to-empty">Completed records will appear here when completion and supporting evidence are saved.</p>}<button className="to-text-link" onClick={showDone}>View completed next steps <ArrowRight size={15}/></button></section></div>
    </div>
    <p className="to-footnote">Portfolio last saved: {latest}. Refresh reads saved records; it does not contact or start an agent. Agent assignments and results remain in their original records.</p>
    </details>
    {selected&&<RecordInspector record={selected} close={()=>setSelected(null)}/>}
  </div>
}
