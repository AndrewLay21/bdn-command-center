import {env} from 'cloudflare:workers';
import {z} from 'zod';

export const dynamic='force-dynamic';
// Shared operational metadata only. Sites must remain owner-private. No task,
// approval, evidence timestamp or owner-private override is touched by a probe.
const key='system:dashboard-connection:v1';
const input=z.object({probeId:z.string().regex(/^[a-zA-Z0-9:_-]{8,100}$/)}).strict();
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function read(){
 if(!env.DB)throw Error('Storage unavailable');
 const row=await env.DB.prepare('SELECT revision,payload,updated_at FROM dashboards WHERE user_id=?').bind(key).first<{revision:number;payload:string;updated_at:string}>();
 return row?{revision:row.revision,...JSON.parse(row.payload),verifiedAt:row.updated_at}:null;
}
export async function GET(){
 try{return json({connection:await read(),scope:'Connection verification only; not a GitHub check or task completion.'});}
 catch{return json({error:'Connection health unavailable.'},503);}
}
export async function POST(request:Request){
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origin not allowed'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required'},415);
 try{
  const raw=await request.text();if(raw.length>300)return json({error:'Payload too large'},413);
  const p=input.safeParse(JSON.parse(raw));if(!p.success)return json({error:'Invalid probe'},400);
  if(!env.DB)throw Error('Storage unavailable');
  const prior=await read();if(prior?.probeId===p.data.probeId)return json({verified:true,connection:prior});
  const now=new Date().toISOString(),payload=JSON.stringify({probeId:p.data.probeId});
  await env.DB.prepare('INSERT INTO dashboards(user_id,revision,payload,updated_at) VALUES(?,1,?,?) ON CONFLICT(user_id) DO UPDATE SET revision=revision+1,payload=excluded.payload,updated_at=excluded.updated_at').bind(key,payload,now).run();
  const saved=await read();
  if(saved?.probeId!==p.data.probeId)return json({error:'Probe readback did not match. Recheck connection.'},409);
  return json({verified:true,connection:saved});
 }catch{return json({error:'Write/readback could not be confirmed. Read connection health before retrying.'},503);}
}
