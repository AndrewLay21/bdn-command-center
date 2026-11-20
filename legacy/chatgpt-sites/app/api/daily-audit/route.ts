import {env} from 'cloudflare:workers';
import {auditInstructions,auditRequestSchema,auditWriteDecision,dailyAuditKey,emptyAudit,mergeAuditUpdates,type AuditState} from '@/lib/daily-audit';
export const dynamic='force-dynamic';
// Shared evidence only, guarded by the existing owner-private Sites dispatch boundary.
// Do not expand the Site audience without adding and reviewing narrower service authorization.
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function read(){if(!env.DB)throw Error('Storage unavailable');const row=await env.DB.prepare('SELECT revision,payload,updated_at FROM dashboards WHERE user_id=?').bind(dailyAuditKey).first<{revision:number;payload:string;updated_at:string}>();return {row,state:row?JSON.parse(row.payload) as AuditState:emptyAudit()};}
export async function GET(){try{const {row,state}=await read();return reply({revision:row?.revision??0,checkedAt:row?.updated_at??null,snapshot:state.snapshot,history:state.history,recordUpdates:state.recordUpdates,instructions:auditInstructions});}catch{return reply({error:'Daily audits could not be loaded. No records were changed.'},503)}}
export async function POST(r:Request){
 const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)return reply({error:'Origin not allowed'},403);
 if(!r.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required'},415);
 try{
  const raw=await r.text();if(raw.length>120000)return reply({error:'Audit is too large'},413);
  const parsed=auditRequestSchema.safeParse(JSON.parse(raw));if(!parsed.success)return reply({error:'Invalid audit',details:parsed.error.flatten()},400);
  const p=parsed.data;const requestHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(p.snapshot))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const {row,state}=await read();const currentRevision=row?.revision??0;const decision=auditWriteDecision(state,currentRevision,p,requestHash,Date.now());
  if(decision==='duplicate')return reply({saved:true,duplicate:true,revision:currentRevision,runId:p.runId,checkedAt:row?.updated_at});
  if(decision!=='write')return reply({error:decision==='future'?'Audit cutoff is in the future':'Conflict: reread the current audit and reconcile',reason:decision},decision==='future'?400:409);
  const now=new Date().toISOString();
  const history=[{runId:p.runId,requestHash,kind:p.snapshot.kind,asOf:p.snapshot.asOf,savedAt:now,summary:p.snapshot.summary,sources:p.snapshot.sources.slice(0,5)},...state.history].slice(0,180);
  const next:AuditState={snapshot:p.snapshot,history,recordUpdates:mergeAuditUpdates(state.recordUpdates??[],p.snapshot.recordUpdates??[])};
  const payload=JSON.stringify(next);if(new TextEncoder().encode(payload).length>900000)return reply({error:'Evidence history is full. Keep the full report in its existing source and shorten the saved summaries.'},413);
  const result=row?await env.DB!.prepare('UPDATE dashboards SET revision=revision+1,payload=?,updated_at=? WHERE user_id=? AND revision=?').bind(payload,now,dailyAuditKey,currentRevision).run():await env.DB!.prepare('INSERT OR IGNORE INTO dashboards(user_id,revision,payload,updated_at) VALUES(?,1,?,?)').bind(dailyAuditKey,payload,now).run();
  if(!result.meta.changes)return reply({error:'Another audit was saved first. Read back and reconcile before retrying.'},409);
  return reply({saved:true,duplicate:false,revision:currentRevision+1,runId:p.runId,checkedAt:now});
 }catch{return reply({error:'Save not confirmed. Read the current audit before retrying.'},503)}
}
