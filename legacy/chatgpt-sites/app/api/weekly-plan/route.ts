import {env} from 'cloudflare:workers';
import plan from '@/lib/tradelab-plan.json';
import portfolio from '@/lib/portfolio.json';
import {mergePortfolioItem} from '@/lib/portfolio-merge';
import {dailyAuditKey,type AuditState} from '@/lib/daily-audit';
export const dynamic='force-dynamic';
// Read-only plan and scoped records. Uses the same owner-private Sites boundary as daily-audit.
// Do not broaden the Site audience without reviewing service authorization.
export async function GET(r:Request){
 try{
  if(!env.DB)throw Error('Storage unavailable');
  const uid=r.headers.get('oai-authenticated-user-id');
  const rows=uid?
   [await env.DB.prepare('SELECT revision,payload,updated_at FROM dashboards WHERE user_id=?').bind('portfolio:v1:'+uid).first<{revision:number;payload:string;updated_at:string}>()].filter(Boolean):
   (await env.DB.prepare("SELECT revision,payload,updated_at FROM dashboards WHERE user_id LIKE 'portfolio:v1:%' LIMIT 2").all<{revision:number;payload:string;updated_at:string}>()).results;
  const row=rows.length===1?rows[0]:null;
  const saved=row?JSON.parse(row.payload):{overrides:{},history:[]};
  const auditRow=await env.DB.prepare('SELECT payload FROM dashboards WHERE user_id=?').bind(dailyAuditKey).first<{payload:string}>();
  const audit=auditRow?JSON.parse(auditRow.payload) as AuditState:null;
  const ids=new Set([plan.projectId,plan.nextStepId,plan.chartRecordId]);
  const records=portfolio.items.filter(i=>ids.has(i.id)).map(i=>{
   const u=audit?.recordUpdates?.find(u=>u.id===i.id);
   return mergePortfolioItem(i,saved.overrides[i.id],u?{status:u.status,nextStep:u.nextStep,note:u.note,proof:u.proof,updatedAt:u.observedAt}:undefined);
  });
  return Response.json({plan,records,portfolioRevision:row?.revision??null,portfolioSavedAt:row?.updated_at??null,privateOverridesReadable:!!uid||rows.length<=1,decisionHistory:plan.decisions,recordHistory:(saved.history??[]).filter((h:{itemId:string})=>ids.has(h.itemId)),storage:'Versioned dashboard source; signed-in record edits remain in existing durable portfolio storage.'},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
 }catch{return Response.json({error:'The weekly plan could not be checked against saved records. Refresh before relying on it.'},{status:503})}
}
