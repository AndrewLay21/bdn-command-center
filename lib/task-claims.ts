/** Isolated candidate: owner-authenticated original-record claims, never age-reclaimed. */
export type ClaimAction='acquire'|'heartbeat'|'release'|'complete';
export type ClaimInput={taskId:string;runId:string;token:string;requestId:string;action:ClaimAction;receipt:string;generation?:number};
export const CLAIM_TTL_MS=15*60*1000;
export type ClaimRecordKind='original'|'portfolio'|'ticket';
export const claimTarget=(kind:ClaimRecordKind,id:string)=>kind==='original'?id:`${kind}:${id}`;
// All predicates are evaluated inside SQLite, not by a preceding JS read.
export const acquireSQL=`INSERT INTO task_claims(owner_id,task_id,run_id,token,generation,state,heartbeat_at,expires_at,last_request,receipt)
 SELECT ?,?,?,?,1,'active',?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM task_claim_events WHERE owner_id=? AND request_id=?)
 ON CONFLICT(owner_id,task_id) DO UPDATE SET run_id=excluded.run_id,token=excluded.token,generation=task_claims.generation+1,state='active',heartbeat_at=excluded.heartbeat_at,expires_at=excluded.expires_at,last_request=excluded.last_request,receipt=excluded.receipt
 WHERE task_claims.state IN ('released','completed')`;
export const transitionSQL=`UPDATE task_claims SET state=?,heartbeat_at=?,expires_at=?,last_request=?,receipt=?
 WHERE owner_id=? AND task_id=? AND run_id=? AND token=? AND state='active'
 AND generation=? AND (?='released' OR expires_at>?)
 AND NOT EXISTS(SELECT 1 FROM task_claim_events WHERE owner_id=? AND request_id=?)`;
export const eventSQL=`INSERT OR IGNORE INTO task_claim_events(owner_id,request_id,task_id,run_id,action,fingerprint,generation,at,receipt)
 SELECT owner_id,?,task_id,run_id,?,?,generation,?,receipt FROM task_claims WHERE owner_id=? AND task_id=? AND last_request=?`;
export const claimGuardSQL=`EXISTS(SELECT 1 FROM task_claims WHERE owner_id=? AND task_id=? AND run_id=? AND token=? AND generation=? AND state='active' AND expires_at>?)`;
export function statements(owner:string,b:ClaimInput,now:number){
 const fingerprint=JSON.stringify([b.taskId,b.runId,b.token,b.action,b.receipt,b.generation??null]);
 const state=b.action==='release'?'released':b.action==='complete'?'completed':'active';
 const values=b.action==='acquire'?[owner,b.taskId,b.runId,b.token,now,now+CLAIM_TTL_MS,b.requestId,b.receipt,owner,b.requestId]:[state,now,now+CLAIM_TTL_MS,b.requestId,b.receipt,owner,b.taskId,b.runId,b.token,b.generation??-1,state,now,owner,b.requestId];
 return {fingerprint,mutation:{sql:b.action==='acquire'?acquireSQL:transitionSQL,values},event:{sql:eventSQL,values:[b.requestId,b.action,fingerprint,now,owner,b.taskId,b.requestId]}};
}
