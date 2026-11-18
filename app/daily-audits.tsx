'use client';
import {useCallback,useEffect,useState} from 'react';
import {ArrowUpRight,Clock3,RefreshCw} from 'lucide-react';
import type {AuditFeed} from '@/lib/daily-audit';
import type {PortfolioItem} from '@/lib/portfolio-types';
import {auditActionView} from '@/lib/audit-action-view';
import config from '@/lib/keep-on-track-config.json';
import './daily-audits.css';
const fmt=(v:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v))+' ET';
const names={setup:'Setup record',morning:'Morning audit',afternoon:'Afternoon audit',closeout:'Closing audit'};
export function AuditActions({actions,items,open}:{actions:string[];items:PortfolioItem[]|undefined;open:(item:PortfolioItem)=>void}){
 return <ul className="pc-audit-list">{actions.map((text,index)=>{const {closed,allClosed}=auditActionView(text,items);return <li key={index} className={allClosed?'pc-audit-closed':undefined}>
  {closed.map(item=><div className="pc-audit-current" key={item.id}><button onClick={()=>open(item)}>{item.id} · Done — view saved evidence</button>{item.updatedAt&&<small>Record saved {fmt(item.updatedAt)}</small>}</div>)}
  {allClosed?<><span>The linked work is already closed. Use the current saved status.</span><details><summary>Read the earlier audit wording</summary><p>{text}</p></details></>:text}
 </li>})}</ul>;
}
export default function DailyAudits({items,open}:{items:PortfolioItem[]|undefined;open:(item:PortfolioItem)=>void}){
 const [feed,setFeed]=useState<AuditFeed|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);try{const r=await fetch('/api/daily-audit',{cache:'no-store'});const data=await r.json() as AuditFeed & {error?:string};if(!r.ok)throw Error(data.error||'Could not load the audit.');setFeed(data);setError('')}catch(e){setError((e as Error).message)}finally{setLoading(false)}},[]);
 useEffect(()=>{load();const timer=setInterval(()=>{if(!document.hidden)load()},60000);return()=>clearInterval(timer)},[load]);
 const s=feed?.snapshot;
 function group(title:string,entries:string[],checkRecords=false){return <section className="pc-panel pc-audit-card"><h2>{title}</h2>{s&&<p className="pc-audit-date">Audit evidence as of {fmt(s.asOf)}</p>}{entries.length?(checkRecords?<AuditActions actions={entries} items={items} open={open}/>:<ul className="pc-audit-list">{entries.map((v,i)=><li key={i}>{v}</li>)}</ul>):<p>No items recorded in this audit.</p>}</section>}
 return <div className="pc-audits"><section className="pc-hero"><div><span className="pc-eyebrow">KEEP ME ON TRACK</span><h2>Three daily check-ins. One clear plan.</h2><p>Morning: choose the next move and your indoor workout. Afternoon: check progress and clear gaps. Evening: record results and prepare tomorrow.</p></div><div className="pc-hero-aside"><Clock3 size={34}/><strong>8 a.m. · 1 p.m. · 7 p.m.</strong><small>Every day · Eastern time<br/>{config.schedule.start}–{config.schedule.end}</small></div></section>
 <div className="pc-note"><strong>Protected learning time:</strong> Monday–Friday 8 AM–noon Eastern is protected. Wednesday radio recording at 10 AM is the standing exception; TradeLab fits around it. Monday Man to Man is not happening. Both schedule decisions are resolved. <a href="/#weekly-schedule">View schedule and capacity</a>. The 8 AM automated audit remains scheduled; no interruption of study is required.</div>
 <div className="pc-note"><strong>Schedule:</strong> {config.schedule.status}. A saved schedule does not prove an audit ran. The dated results below show what was saved. Agents continue with the next eligible task during an active run; this page does not keep them running.</div>
 {error&&<div className="pc-alert" role="alert">{error} {feed?'Previously loaded information may be out of date.':''}</div>}
 <div className="pc-sectionhead"><h2>{s?names[s.kind]:'Latest audit'}</h2><button className="pc-textbutton" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?'Refreshing…':'Refresh results'}</button></div>
 {s?<><section className="pc-panel"><span className="pc-eyebrow">EVIDENCE AS OF {fmt(s.asOf)}</span><h2>{s.kind==='setup'?'Saved setup summary':'Saved audit summary'}</h2><p>{s.summary}</p><p className="pc-small">{s.kind==='setup'?'This confirms setup information, not a completed scheduled audit.':'These are saved findings. Completion and active-work claims require the supporting evidence.'} Saved {feed?.checkedAt?fmt(feed.checkedAt):'date unavailable'}.</p><p className="pc-small">Later task updates and founder decisions take precedence. {items?'Closed tasks linked by record ID are marked below; the original wording is preserved.':'Current task statuses could not be checked.'} <a href="/#next-steps">View current Next Steps</a>.</p></section>
 <div className="pc-audit-grid pc-space">{group('Actions recorded in this audit',s.coachActions,true)}{group('Finished with evidence',s.completed)}{group('Work reported in this audit',s.inProgress)}{group('Gaps recorded in this audit',s.gaps)}</div>
 <div className="pc-space">{group('Next work recorded in this audit',s.next,true)}</div>
 {s.workout&&<section className="pc-panel pc-space"><span className="pc-eyebrow">INDOOR MOVEMENT</span><h2>Your workout</h2><p className="pc-pre">{s.workout}</p><p className="pc-small">Completion is recorded only when you report it. Use an easier option or rest if needed.</p></section>}
 <section className="pc-panel pc-space"><h2>Evidence and source files</h2><div className="pc-links">{s.sources.map((v,i)=><a href={v.url} target="_blank" rel="noopener noreferrer" key={i}>{v.label}<ArrowUpRight size={15}/></a>)}</div></section>
 </>:!loading&&<div className="pc-empty">No audit has been saved yet. The schedule and a successful audit are separate checks.</div>}
 {loading&&!feed&&<div className="pc-empty">Loading the latest audit…</div>}
 <section className="pc-panel pc-space"><h2>Earlier check-ins</h2>{feed?.history.length?feed.history.map(h=><details className="pc-audit-history" key={h.runId}><summary>{names[h.kind]} · {fmt(h.asOf)}</summary><p>{h.summary}</p><div className="pc-links">{h.sources.map((v,i)=><a key={i} href={v.url} target="_blank" rel="noopener noreferrer">{v.label}<ArrowUpRight size={14}/></a>)}</div><p className="pc-small">Saved {fmt(h.savedAt)}</p></details>):<p>No earlier results are recorded.</p>}</section>
 </div>;
}
