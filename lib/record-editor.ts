import {ticketFields,ticketSchema} from './tickets';
export type RecordKind='portfolio'|'original'|'ticket';
export type PendingSave={id:string;revision:number;expected:Record<string,unknown>;acknowledged:boolean};
const keys={ticket:ticketFields,portfolio:['status','owner','nextStep','note','proof'],original:['status','notes','evidence','deadline','deadlineConfirmed']} as const;
export const recordEndpoint=(kind:RecordKind)=>kind==='ticket'?'/api/tickets':kind==='portfolio'?'/api/portfolio':'/api/dashboard';
export function editableSnapshot(kind:RecordKind,value:unknown){
  const record=value as Record<string,unknown>;
  return Object.fromEntries(keys[kind].map(key=>[key,((kind==='portfolio'&&['owner','nextStep'].includes(key))||(kind==='ticket'&&['title','agent','deliverable','nextAction','reviewer'].includes(key)))?String(record[key]??'').trim():record[key]]));
}
export function recordChanged(kind:RecordKind,draft:unknown,baseline:unknown){return !!draft&&!!baseline&&JSON.stringify(editableSnapshot(kind,draft))!==JSON.stringify(editableSnapshot(kind,baseline))}
export function needsAcceptance(kind:RecordKind,status:string){return kind==='ticket'?status==='Done':kind==='portfolio'?status==='Done':['Approved','Verified complete'].includes(status)}
export function validateRecord(kind:RecordKind,value:unknown,accepted:boolean){
  const record=value as Record<string,unknown>,fields=editableSnapshot(kind,value);
  if(kind==='ticket'){const parsed=ticketSchema.safeParse({id:record.id,...fields,revision:0,accepted});if(!parsed.success)return 'Fill in the title, parent, deliverable and next action.';if(record.status==='Done'&&!accepted)return 'Confirm the reviewer accepted the exact deliverable.';return ''}
  if(kind==='portfolio'&&(!fields.owner||!fields.nextStep))return 'Add an owner and a next step before saving.';
  if(needsAcceptance(kind,String(record.status))){
    const proof=String(kind==='portfolio'?record.proof:record.evidence);
    if(proof.trim().length<20)return 'Add a specific evidence note or supporting link (at least 20 characters).';
    if(!accepted)return 'Review the evidence and check the confirmation below before saving this outcome.';
  }
  return '';
}
export async function beginRecordSave(kind:RecordKind,draft:{id:string},revision:number,accepted:boolean,fetcher:typeof fetch=fetch,claim?:{runId:string;token:string;generation:number}):Promise<{pending:PendingSave|null;error:string}>{
  const expected=editableSnapshot(kind,draft);
  const pending:PendingSave={id:draft.id,revision:revision+1,expected,acknowledged:false};
  try{
    const response=await fetcher(recordEndpoint(kind),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:draft.id,...expected,revision,accepted,...(claim?{claim:{runId:claim.runId,token:claim.token,generation:claim.generation}}:{})})});
    const body=await response.json().catch(()=>({})) as {saved?:boolean;revision?:number;error?:string};
    if(!response.ok){
      // A rejected request can be edited. Ambiguous server/network failures must be read back before another write.
      if(response.status>=400&&response.status<500)return {pending:null,error:body.error||'The update was not accepted. Review your draft before saving again.'};
      return {pending,error:body.error||'The save could not be confirmed. Check the saved record before trying again.'};
    }
    if(body.saved!==true||!Number.isInteger(body.revision)||body.revision! <= revision)return {pending,error:'The save response was incomplete. Check the saved record before trying again.'};
    return {pending:{...pending,revision:body.revision!,acknowledged:true},error:''};
  }catch{return {pending,error:'The connection ended before the save could be confirmed. Your draft is kept here; check the saved record before trying again.'}}
}
export async function readSavedRecord(kind:RecordKind,pending:PendingSave,fetcher:typeof fetch=fetch){
  const response=await fetcher(recordEndpoint(kind),{cache:'no-store'});
  if(!response.ok)throw Error('Readback is unavailable. Your draft is kept here. Use “Check saved record” to retry the check.');
  const data=await response.json() as {revision:number;items?:Record<string,unknown>[];tasks?:Record<string,unknown>[]};
  const records=kind==='original'?data.tasks:data.items;
  const item=Array.isArray(records)?records.find(record=>record.id===pending.id):undefined;
  if(!Number.isInteger(data.revision)||data.revision<pending.revision||!item||JSON.stringify(editableSnapshot(kind,item))!==JSON.stringify(pending.expected))throw Error('The saved record does not match this draft yet. Copy your draft, then close and reopen the latest record before changing it again.');
  return {data,item};
}
export function newYorkDeadline(date:string){
  if(!date)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Choose a valid date.');
  const zone=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'longOffset'}).formatToParts(new Date(date+'T23:59:00Z')).find(part=>part.type==='timeZoneName')?.value;
  const offset=zone?.match(/^GMT([+-]\d{2}:\d{2})$/)?.[1];
  if(!offset)throw Error('The New York time zone could not be resolved.');
  return `${date}T23:59:00${offset}`;
}
