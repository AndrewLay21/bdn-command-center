import {GET as portfolioGET} from '@/app/api/portfolio/route';
import {GET as dashboardGET} from '@/app/api/dashboard/route';
import {GET as auditGET} from '@/app/api/daily-audit/route';
import {GET as weeklyGET} from '@/app/api/weekly-plan/route';
import type {PortfolioData} from './portfolio-types';
import type {AuditFeed} from './daily-audit';
import type {ChatReference} from './dashboard-chat';
import type seed from './seed.json';
import {chatFounderContext} from './chat-founder-context';
const short=(value:unknown,max=650)=>typeof value==='string'?value.slice(0,max):'';
export async function dashboardChatContext(request:Request,query:string){
 const names=['Portfolio','Original records','Daily audit','Weekly plan'];
 const results=await Promise.allSettled([portfolioGET(request),dashboardGET(request),auditGET(),weeklyGET(request)].map(async response=>{const r=await response;if(!r.ok)throw Error('Source unavailable');return r.json()}));
 if(results[0].status!=='fulfilled')throw Error('Your saved portfolio could not be checked. Refresh the dashboard before asking again.');
 const unavailable=results.flatMap((v,i)=>v.status==='rejected'?[names[i]]:[]);
 const portfolio=results[0].value as PortfolioData;
 const original=results[1].status==='fulfilled'?(results[1].value as {tasks:typeof seed}).tasks:[];
 const audit=results[2].status==='fulfilled'?results[2].value as AuditFeed:null;
 const weekly=results[3].status==='fulfilled'?results[3].value as {plan:unknown}:null;
 const records:(ChatReference&{status:string;owner:string;at:string;next:string;evidence:string;notes:string})[]=portfolio.items.map(i=>({id:i.id,title:i.title,status:i.status,owner:i.owner,source:'portfolio' as const,at:i.updatedAt||i.sourceDate,next:short(i.nextStep),evidence:short(i.proof),notes:short(i.note)}));
 const known=new Set(records.map(r=>r.id));
 records.push(...original.filter(t=>!known.has(t.id)).map(t=>({id:t.id,title:t.title,status:t.status,owner:t.owner,source:'original' as const,at:t.updated,next:short(t.action),evidence:short(t.evidence),notes:short(t.notes)})));
 const words=query.toLowerCase().match(/[a-z0-9-]{3,}/g)??[];
 const score=(r:typeof records[number])=>words.reduce((n,w)=>n+(r.id.toLowerCase()===w?100:`${r.title} ${r.owner} ${r.status} ${r.next}`.toLowerCase().includes(w)?1:0),0);
 const details=[...records].sort((a,b)=>score(b)-score(a)||(Date.parse(b.at)||0)-(Date.parse(a.at)||0)).slice(0,20);
 const checkedAt=new Date().toISOString();
 const context={checkedAt,unavailable,portfolioRevision:portfolio.revision,datedFounderDirections:chatFounderContext,founderSourceLimit:'These dated home-page directions are not a fresh read of their linked sheets; later owner decisions take precedence.',
  recordIndex:records.map(({id,title,status,owner,source,at})=>({id,title:short(title,160),status,owner,source,at})),
  selectedDetails:details,detailSelection:'Only the 20 most relevant/recent detailed records are included; the index contains all records.',
  audit:audit?.snapshot?{kind:audit.snapshot.kind,asOf:audit.snapshot.asOf,summary:audit.snapshot.summary,coachActions:audit.snapshot.coachActions,gaps:audit.snapshot.gaps}:null,
  weeklyPlan:weekly?.plan??null};
 return {context,references:records.map(({id,title,source})=>({id,title,source})) as ChatReference[],checkedAt,unavailable};
}
