import {env} from 'cloudflare:workers';
import {z} from 'zod';
import seed from '@/lib/seed.json';
import portfolio from '@/lib/portfolio.json';
import {statements} from '@/lib/task-claims';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const input=z.object({taskId:z.string().max(50),runId:z.string().min(8).max(120),token:z.string().uuid(),requestId:z.string().uuid(),action:z.enum(['acquire','heartbeat','release','complete']),receipt:z.string().max(4000),generation:z.number().int().positive().optional()}).strict().refine(b=>b.action==='acquire'||b.generation!==undefined,{message:'Generation required for holder actions'});
function knownTarget(taskId:string){
 if(seed.some(t=>t.id===taskId))return true;
 if(taskId.startsWith('portfolio:'))return portfolio.items.some(item=>item.id===taskId.slice(10));
 if(taskId.startsWith('ticket:'))return z.string().uuid().safeParse(taskId.slice(7)).success;
 return false;
}
export async function GET(r:Request){
 const owner=r.headers.get('oai-authenticated-user-id');if(!owner)return json({error:'Sign in required'},401);
 const task=new URL(r.url).searchParams.get('taskId')??'';if(!knownTarget(task))return json({error:'Unknown task'},404);
 try {const claim=await env.DB!.prepare('SELECT task_id,run_id,generation,state,heartbeat_at,expires_at,receipt FROM task_claims WHERE owner_id=? AND task_id=?').bind(owner,task).first();
 const events=await env.DB!.prepare('SELECT request_id,run_id,action,generation,at,receipt FROM task_claim_events WHERE owner_id=? AND task_id=? ORDER BY at DESC,request_id DESC LIMIT 100').bind(owner,task).all();
 return json({claim,events:events.results,limits:'Latest 100 events shown; all events retained. Expiration blocks writes, never transfers ownership. Claimed work is not task completion.'});
 }catch{return json({error:'Claim storage unavailable; no authority to write'},503)}
}
export async function POST(r:Request){
 const owner=r.headers.get('oai-authenticated-user-id');if(!owner)return json({error:'Sign in required'},401);
 if(r.headers.get('origin')!==new URL(r.url).origin)return json({error:'Origin not allowed'},403);
 if(!r.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
 try {const raw=await r.text();if(raw.length>7000)return json({error:'Request too large'},413);
 const p=input.safeParse(JSON.parse(raw));if(!p.success)return json({error:'Invalid claim request'},400);const b=p.data;
 if(!knownTarget(b.taskId))return json({error:'Unknown task'},404);
 if(['release','complete'].includes(b.action)&&b.receipt.trim().length<20)return json({error:'Explicit end/release evidence required'},400);
 const s=statements(owner,b,Date.now());
 // D1 batch is a transaction; ownership transition and immutable receipt commit together.
 await env.DB!.batch([env.DB!.prepare(s.mutation.sql).bind(...s.mutation.values),env.DB!.prepare(s.event.sql).bind(...s.event.values)]);
 const event=await env.DB!.prepare('SELECT fingerprint,generation FROM task_claim_events WHERE owner_id=? AND request_id=?').bind(owner,b.requestId).first<{fingerprint:string;generation:number}>();
 if(!event||event.fingerprint!==s.fingerprint)return json({error:'Claim conflict, expired holder, or reused request ID. Read current claim; never reclaim by age.'},409);
 return json({saved:true,generation:event.generation,requestId:b.requestId,action:b.action,notice:'Receipt acknowledges this operation only; read current state before work. Completion closes the claim, not the parent task.'});
 }catch{return json({error:'Claim action unconfirmed; read back before retrying with the same request ID'},503)}
}
