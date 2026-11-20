import {DASHBOARD_CHAT_SEND_HELD,DASHBOARD_CHAT_HOLD_NOTICE} from '@/lib/dashboard-chat-hold';
import {z} from 'zod';
import {chatAgentIds} from '@/lib/chat-agents';
import {dashboardChatContext} from '@/lib/dashboard-chat-context';
import {buildChatHandoff} from '@/lib/chat-handoff';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
const schema=z.object({agent:z.enum(chatAgentIds),message:z.string().trim().min(1).max(2000)}).strict();

export async function POST(request:Request){
 if(!request.headers.get('oai-authenticated-user-id'))return reply({error:'Sign in to prepare your dashboard context.'},401);
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Prepare the question from your dashboard.'},403);
 if(DASHBOARD_CHAT_SEND_HELD)return reply({error:DASHBOARD_CHAT_HOLD_NOTICE,code:'send_held'},423);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required.'},415);
 let input:z.infer<typeof schema>;
 try{const raw=await request.text();if(raw.length>14000)return reply({error:'Please shorten your question.'},413);input=schema.parse(JSON.parse(raw));}
 catch{return reply({error:'Choose a dashboard role and enter a question of up to 2,000 characters.'},400);}
 try{
  const result=await dashboardChatContext(request,input.message);
  return reply({text:buildChatHandoff(input.agent,input.message,result.context),checkedAt:result.checkedAt,unavailable:result.unavailable});
 }catch{return reply({error:'Saved records could not be checked. Your question is still here. You can copy it directly into ChatGPT or try preparing the context again.'},503);}
}
