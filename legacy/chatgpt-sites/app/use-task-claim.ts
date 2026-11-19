'use client';
import {useRef,useState} from 'react';
export function useTaskClaim(){
 const [runId,setRunId]=useState(''),[proof,setProof]=useState<{runId:string;token:string;generation:number}|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 const held=useRef<{taskId:string;runId:string;token:string;generation:number}|null>(null),request=useRef<{action:string;body:Record<string,unknown>}|null>(null);
 const storageKey=(taskId:string)=>'command-center-task-claim:'+taskId;
 const remember=(value:{taskId:string;runId:string;token:string;generation:number})=>{if(typeof sessionStorage!=='undefined')sessionStorage.setItem(storageKey(value.taskId),JSON.stringify(value))};
 const forget=(taskId:string)=>{if(typeof sessionStorage!=='undefined')sessionStorage.removeItem(storageKey(taskId))};
 async function send(action:'acquire'|'heartbeat'|'release',taskId:string){
  if(inFlight.current)throw Error('Claim request already pending.');inFlight.current=true;setBusy(true);
  try{
   if(request.current&&request.current.action!==action)throw Error('Retry the uncertain claim action before starting a different action.');
   if(!request.current){if(action!=='acquire'&&!held.current)throw Error('No claim held by this form.');if(action==='acquire'&&held.current)throw Error('Release the existing claim first.');
    request.current={action,body:{taskId,runId:held.current?.runId||runId.trim()||'manual-'+crypto.randomUUID(),token:held.current?.token||crypto.randomUUID(),requestId:crypto.randomUUID(),action,...(held.current?{generation:held.current.generation}:{}),receipt:action==='release'?'This form has ended its work and explicitly releases the claim.':'Existing record form claim; does not authorize additional work.'}};
   }
   const body=request.current.body;
   const response=await fetch('/api/task-claims',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json() as {error?:string;generation:number};
   if(!response.ok){if(response.status<500)request.current=null;throw Error(result.error||'Claim request failed.');}
   if(action==='release'){
    const read=await fetch('/api/task-claims?taskId='+encodeURIComponent(taskId),{cache:'no-store'});if(!read.ok)throw Error('Release readback failed. Retry the same release request.');
    const state=(await read.json() as {claim:{run_id:string;generation:number;state:string}|null}).claim;
    if(!state||state.generation<result.generation||(state.generation===result.generation&&state.state!=='released'))throw Error('Release outcome not verified; keep this form open.');
    forget(taskId);held.current=null;setProof(null);request.current=null;setMessage('Claim release saved and read back.');return;
   }
   const read=await fetch('/api/task-claims?taskId='+encodeURIComponent(taskId),{cache:'no-store'});if(!read.ok)throw Error('Claim readback failed. Retry the same action.');const current=(await read.json() as {claim:{run_id:string;generation:number;state:string;expires_at:number}|null}).claim;
   if(!current||current.run_id!==body.runId||current.generation!==result.generation||current.state!=='active'||current.expires_at<=Date.now())throw Error('Claim no longer active. Do not work; inspect the claim history.');
   const value={taskId,runId:String(body.runId),token:String(body.token),generation:result.generation};held.current=value;remember(value);setProof({runId:value.runId,token:value.token,generation:value.generation});request.current=null;setMessage('Exclusive claim checked. Renew within 15 minutes; expiration blocks writes and never hands off ownership.');
  }catch(e){setMessage((e as Error).message);throw e}finally{inFlight.current=false;setBusy(false)}
 }
 async function recover(taskId:string){
  if(inFlight.current)throw Error('Claim request already pending.');inFlight.current=true;setBusy(true);
  try{const raw=typeof sessionStorage!=='undefined'?sessionStorage.getItem(storageKey(taskId)):null;if(!raw)throw Error('No claim proof is stored in this browser session. The claiming run must end or release it.');
   const saved=JSON.parse(raw) as {taskId:string;runId:string;token:string;generation:number};if(saved.taskId!==taskId)throw Error('Stored claim target does not match this record.');
   const read=await fetch('/api/task-claims?taskId='+encodeURIComponent(taskId),{cache:'no-store'});if(!read.ok)throw Error('Claim state could not be checked.');
   const current=(await read.json() as {claim:{run_id:string;generation:number;state:string;expires_at:number}|null}).claim;
   if(!current||current.run_id!==saved.runId||current.generation!==saved.generation||current.state!=='active'){forget(taskId);throw Error(current&&['released','completed'].includes(current.state)?'The prior run ended positively. Acquire a new claim for new work.':'Stored proof is no longer the current holder. Inspect claim history; do not write.');}
   held.current=saved;setRunId(saved.runId);setProof({runId:saved.runId,token:saved.token,generation:saved.generation});setMessage(current.expires_at>Date.now()?'This browser session recovered and rechecked its existing claim.':'Expired holder proof recovered for explicit release only. Writes remain blocked; ownership was not transferred.');
  }catch(e){setMessage((e as Error).message);throw e}finally{inFlight.current=false;setBusy(false)}
 }
 return {runId,setRunId,proof,message,busy,held,request,acquire:(id:string)=>send('acquire',id),heartbeat:(id:string)=>send('heartbeat',id),release:(id:string)=>send('release',id),recover};
}
