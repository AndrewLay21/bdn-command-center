import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {claimGuardSQL} from '@/lib/task-claims';
import {GET as readDashboard} from '../dashboard/route';
export const dynamic='force-dynamic';
const schema=z.object({id:z.string().min(1).max(50),revision:z.number().int().min(0),claim:z.object({runId:z.string().min(8).max(120),token:z.string().uuid(),generation:z.number().int().positive()}).strict()}).strict();
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
export async function POST(r:Request){
 const uid=r.headers.get('oai-authenticated-user-id');
 if(!uid)return json({error:'Sign in required.'},401);
 if(r.headers.get('origin')!==new URL(r.url).origin)return json({error:'Origin not allowed.'},403);
 if(r.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required'},415);
 try{
  const raw=await r.text();if(raw.length>2000)return json({error:'Update too large'},413);
  const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'Only task id, revision and exclusive claim are accepted.'},400);
  const body=parsed.data,db=env.DB;if(!db)return json({error:'Storage unavailable'},503);
  const response=await readDashboard(r);if(!response.ok)return response;
  const snapshot=await response.json() as {revision:number;tasks:Array<{id:string;title:string;status:string;deadline:string;deadlineConfirmed:boolean}>};
  if(snapshot.revision!==body.revision)return json({error:'A newer update exists. Refresh before saving.'},409);
  const task=snapshot.tasks.find(t=>t.id===body.id);if(!task)return json({error:'Unknown task'},404);
  if(task.deadlineConfirmed || !task.deadline || !Number.isFinite(Date.parse(task.deadline)) || Date.parse(task.deadline)>=Date.now())return json({error:'Only an expired, unconfirmed deadline can be cleared.'},400);
  const row=await db.prepare('SELECT revision,payload FROM dashboards WHERE user_id=?').bind(uid).first<{revision:number;payload:string}>();
  if((row?.revision??0)!==body.revision)return json({error:'A newer update exists. Refresh before saving.'},409);
  const data=row?JSON.parse(row.payload):{overrides:{},history:[]};const now=new Date().toISOString();
  // Do not rewrite overrides, accepted, evidence, status, ownership or task.updated.
  data.deadlineClears={...data.deadlineClears,[body.id]:{previousDeadline:task.deadline,clearedAt:now}};
  data.history=[{id:crypto.randomUUID(),taskId:body.id,title:task.title,from:task.status,to:task.status,at:now,kind:'deadline-cleanup',previousDeadline:task.deadline,deadline:'',note:'Expired unconfirmed deadline cleared; task acceptance and status unchanged.',evidence:'Founder-authorized administrative cleanup; exclusive claim and current revision verified.'},...(data.history??[])];
  const guard=[uid,body.id,body.claim.runId,body.claim.token,body.claim.generation,Date.now()];
  const result=row?await db.prepare('UPDATE dashboards SET revision=revision+1,payload=?,updated_at=? WHERE user_id=? AND revision=? AND '+claimGuardSQL).bind(JSON.stringify(data),now,uid,body.revision,...guard).run():await db.prepare('INSERT OR IGNORE INTO dashboards(user_id,revision,payload,updated_at) SELECT ?,1,?,? WHERE '+claimGuardSQL).bind(uid,JSON.stringify(data),now,...guard).run();
  if(!result.meta.changes)return json({error:'Valid exclusive claim and current revision required.'},409);
  return json({saved:true,revision:body.revision+1,previousDeadline:task.deadline,deadline:'',acceptanceChanged:false});
 }catch{return json({error:'Update could not be confirmed. Read current state before retrying.'},503);}
}
