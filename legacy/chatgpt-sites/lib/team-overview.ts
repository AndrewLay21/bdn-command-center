import type {PortfolioItem} from './portfolio-types';

export type SavedTask = {id:string; kind:string; title:string; owner:string; status:string; action:string; evidence:string; notes:string; updated:string};
export type TeamRecord = {id:string; title:string; owner:string; status:string; next:string; evidence:string; at:string; source:'portfolio'|'original'};
export type AgentId = 'drew'|'mansa'|'dex';
export function agentFor(owner:string):AgentId|null {
  const name=owner.toLowerCase().replace(/[\s._-]/g,'');
  if(name==='drew20') return 'drew';
  if(['mansamusa','mansa','mansamusamuse','mansamusamuseagent','roman/muse'].includes(name)) return 'mansa';
  if(['codex','dex','dexthebest'].includes(name)) return 'dex';
  return null;
}
export function teamRecords(items:PortfolioItem[],tasks:SavedTask[]):TeamRecord[] {
  // Founder-authorized display aliases only; preserve stored ownership and source boundaries.
  const portfolio=items.filter(i=>i.type==='step').map(i=>({id:i.id,title:i.title,owner:i.owner,status:i.status,next:i.nextStep,evidence:i.proof,at:i.updatedAt||i.sourceDate,source:'portfolio' as const}));
  const original=tasks.filter(t=>t.kind==='task').map(t=>({id:t.id,title:t.title,owner:t.owner,status:t.status,next:t.action,evidence:t.evidence,at:t.updated,source:'original' as const}));
  const known=new Set(portfolio.map(i=>i.id));
  return [...portfolio,...original.filter(t=>!known.has(t.id))];
}
export function isRecordedDone(record:TeamRecord) {
  return ['Done','Verified complete'].includes(record.status)&&record.evidence.trim().length>0;
}
export function agentWork(records:TeamRecord[],agent:AgentId) {
  const owned=records.filter(r=>agentFor(r.owner)===agent).sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0));
  const completed=owned.filter(isRecordedDone);
  const reported=owned.filter(r=>r.status==='Reported complete');
  const approved=owned.filter(r=>r.status==='Approved');
  const current=owned.filter(r=>!['Done','Verified complete','Reported complete','Approved','Parked','Reference','Hold'].includes(r.status));
  const primary=agent==='drew'?'DOT-003':agent==='mansa'?'GAP-10':null;
  current.sort((a,b)=>Number(b.id===primary)-Number(a.id===primary));
  return {current,completed,reported,approved};
}
