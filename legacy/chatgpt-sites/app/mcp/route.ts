import {POST as clearDeadline} from '../api/deadline-cleanup/route';
import {GET as readStatus,POST as updateStatus} from '../api/coach-core-sync/route';
import {POST as checkConnection} from '../api/connection-health/route';
import {GET as readWork,POST as saveWork} from '../api/dashboard/route';
import {GET as readPortfolio} from '../api/portfolio/route';
import {GET as readTickets} from '../api/tickets/route';
import {GET as readClaims,POST as changeClaim} from '../api/task-claims/route';
import {GET as readReconciliation,POST as reconcileQueue} from '../api/queue-reconciliation/route';
import {executionRequest} from '@/lib/execution-transport';

export const dynamic='force-dynamic';
// Sites authenticates MCP callers and enforces this Site's owner-private policy.
// Existing record mutations reuse their authenticated revision/claim guards.
// No external dispatch, founder decisions, source code or release operations.
const tools=[
 {name:'clear_obsolete_deadline',description:'Clear only an expired, unconfirmed original-task deadline after explicit cleanup authorization. Read current work, acquire its claim, call with current revision, read back, then release. Preserves task status, acceptance (including absent legacy values), evidence, owners and holds; retains old date in history. Never use acceptance toggles or full-record retries for date cleanup.',inputSchema:{type:'object',properties:{id:{type:'string'},revision:{type:'integer',minimum:0},claim:{type:'object',properties:{runId:{type:'string'},token:{type:'string',format:'uuid'},generation:{type:'integer',minimum:1}},required:['runId','token','generation'],additionalProperties:false}},required:['id','revision','claim'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
 {name:'get_execution_work',description:'Read current original records, portfolio ownership and tickets through the existing private workflow. Existing scheduled agents pull their assigned work here; this does not start a runner. Preserve holds and ownership. Claim before writing; save a receipt and read back, then explicitly release. Mansa owns approved publishing, Drew2.0 coordinates editorial/magazine/portfolio, Dex engineering; Kev scope stays reserved.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'get_task_claim',description:'Read the current shared task claim and audit events. Expiration never transfers ownership.',inputSchema:{type:'object',properties:{taskId:{type:'string'}},required:['taskId'],additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'change_task_claim',description:'Acquire, heartbeat, complete or release a shared task claim. Use the same run, token and returned generation; retain requestId for identical retries. Never reclaim by age. Complete closes the claim only.',inputSchema:{type:'object',properties:{taskId:{type:'string'},runId:{type:'string'},token:{type:'string',format:'uuid'},requestId:{type:'string',format:'uuid'},action:{type:'string',enum:['acquire','heartbeat','release','complete']},receipt:{type:'string'},generation:{type:'integer',minimum:1}},required:['taskId','runId','token','requestId','action','receipt'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
 {name:'save_task_update',description:'Save through the existing original-record update form backend with current revision and exclusive claim. Read get_execution_work first; preserve prior evidence/notes/history/status/holds. Provide the full form payload; read back before releasing.',inputSchema:{type:'object',properties:{id:{type:'string'},revision:{type:'integer'},status:{type:'string'},notes:{type:'string'},evidence:{type:'string'},deadline:{type:'string'},deadlineConfirmed:{type:'boolean'},accepted:{type:'boolean'},claim:{type:'object',properties:{runId:{type:'string'},token:{type:'string'},generation:{type:'integer'}},required:['runId','token','generation'],additionalProperties:false}},required:['id','revision','status','notes','evidence','deadline','deadlineConfirmed','accepted','claim'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
 {name:'get_queue_reconciliation',description:'Read baseline, exact owner overrides, digests and retained per-record reconciliation receipts. Review each changed field against current founder direction.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'save_queue_reconciliation',description:'Save one exact, evidence-backed review with a current exclusive claim. Does not change ownership, complete tasks or restart legacy dispatch.',inputSchema:{type:'object',properties:{taskId:{type:'string'},revision:{type:'integer'},digest:{type:'string'},requestId:{type:'string'},verified:{type:'boolean',const:true},evidence:{type:'string'},claim:{type:'object',properties:{runId:{type:'string'},token:{type:'string'},generation:{type:'integer'}},required:['runId','token','generation'],additionalProperties:false}},required:['taskId','revision','digest','requestId','verified','evidence','claim'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
 {name:'get_coach_core_status',description:'Read saved Coach Core evidence, revision and update instructions. Saved timestamps do not establish live agent activity.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'update_coach_core_status',description:'Save a source-backed Coach Core evidence snapshot using its current revision. Read get_coach_core_status first and follow its instructions; independent scope acceptance is required for verified completion. Cannot change founder decisions or private owner overrides.',inputSchema:{type:'object',properties:{revision:{type:'integer',minimum:0},snapshot:{type:'object',description:'Complete snapshot following the versioned instructions and existing schema returned by get_coach_core_status.'}},required:['revision','snapshot'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
 {name:'check_dashboard_connection',description:'Verify a durable write and readback of connection metadata only. Leaves tasks, decisions, owners, evidence and source freshness unchanged.',inputSchema:{type:'object',properties:{probeId:{type:'string',pattern:'^[a-zA-Z0-9:_-]{8,100}$'}},required:['probeId'],additionalProperties:false},annotations:{readOnlyHint:false,destructiveHint:false}},
];
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origin not allowed'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required'},415);
 let id:unknown=null;
 try{
  const raw=await request.text();if(raw.length>110000)return json({error:'Payload too large'},413);
  const rpc=JSON.parse(raw);id=rpc.id??null;
  if(rpc.jsonrpc!=='2.0'||typeof rpc.method!=='string')return json({jsonrpc:'2.0',id,error:{code:-32600,message:'Invalid request'}});
  let result:unknown;
  if(rpc.method==='server/discover')result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};
  else if(rpc.method==='initialize')result={protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'coach-drew-command-center',version:'1.0.0'}};
  else if(rpc.method==='notifications/initialized')return new Response(null,{status:202});
  else if(rpc.method==='tools/list')result={tools};
  else if(rpc.method==='tools/call'){
   const name=rpc.params?.name,args=rpc.params?.arguments??{};
   if(!args||typeof args!=='object'||Array.isArray(args))return json({jsonrpc:'2.0',id,error:{code:-32602,message:'Object arguments required'}});
   let response:Response;
   if(['get_execution_work','get_task_claim','change_task_claim','save_task_update','clear_obsolete_deadline','get_queue_reconciliation','save_queue_reconciliation'].includes(name)){
    if(!request.headers.get('oai-authenticated-user-id'))response=Response.json({error:'Authenticated owner identity required'},{status:401});
    else if(name==='get_execution_work'){
     if(Object.keys(args).length)return json({jsonrpc:'2.0',id,error:{code:-32602,message:'No arguments expected'}});
     const records=await readWork(executionRequest(request,'/api/dashboard')),portfolio=await readPortfolio(executionRequest(request,'/api/portfolio')),tickets=await readTickets(executionRequest(request,'/api/tickets'));
     response=Response.json({records:await records.json(),portfolio:await portfolio.json(),tickets:await tickets.json(),route:'Existing schedules pull work; no external push dispatcher. Browser agents use the same /records form and /api/task-claims. Acknowledgment and scheduled completion require their own receipts.'},{status:records.ok&&portfolio.ok&&tickets.ok?200:503});
    }else if(name==='get_task_claim')response=await readClaims(executionRequest(request,'/api/task-claims?taskId='+encodeURIComponent(args.taskId??'')));
    else if(name==='change_task_claim')response=await changeClaim(executionRequest(request,'/api/task-claims',args));
    else if(name==='clear_obsolete_deadline')response=await clearDeadline(executionRequest(request,'/api/deadline-cleanup',args));
    else if(name==='save_task_update'){
     // Compatibility for older connectors: a strictly date-only legacy request
     // uses the cleanup operation without synthesizing acceptance.
     const snapshot=await readWork(executionRequest(request,'/api/dashboard'));
     const current=snapshot.ok?(await snapshot.json() as {tasks:Array<{id:string;status:string;notes:string;evidence:string;accepted?:boolean}>}).tasks.find(t=>t.id===args.id):undefined;
     const keys=['id','revision','status','notes','evidence','deadline','deadlineConfirmed','accepted','claim'];
     const dateOnly=current && !Object.prototype.hasOwnProperty.call(current,'accepted') && args.accepted===false && args.deadline==='' && args.deadlineConfirmed===false && args.status===current.status && args.notes===current.notes && args.evidence===current.evidence && Object.keys(args).length===keys.length && Object.keys(args).every(k=>keys.includes(k));
     response=dateOnly?await clearDeadline(executionRequest(request,'/api/deadline-cleanup',{id:args.id,revision:args.revision,claim:args.claim})):await saveWork(executionRequest(request,'/api/dashboard',args));
    }
    else if(name==='get_queue_reconciliation')response=await readReconciliation(executionRequest(request,'/api/queue-reconciliation'));
    else response=await reconcileQueue(executionRequest(request,'/api/queue-reconciliation',args));
   }else if(name==='get_coach_core_status'){
    if(Object.keys(args).length)return json({jsonrpc:'2.0',id,error:{code:-32602,message:'No arguments expected'}});
    response=await readStatus();
   }else if(name==='update_coach_core_status'||name==='check_dashboard_connection'){
    response=await (name==='update_coach_core_status'?updateStatus:checkConnection)(new Request(new URL(name==='update_coach_core_status'?'/api/coach-core-sync':'/api/connection-health',request.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)}));
   }else return json({jsonrpc:'2.0',id,error:{code:-32602,message:'Unknown tool'}});
   result={content:[{type:'text',text:await response.text()}],isError:!response.ok};
  }else return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
  return json({jsonrpc:'2.0',id,result});
 }catch{return json({jsonrpc:'2.0',id,error:{code:-32603,message:'Request could not be completed. Read saved state before retrying.'}});}
}
