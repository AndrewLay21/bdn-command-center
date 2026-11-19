'use client';
import {useTaskClaim} from './use-task-claim';
import {useEffect,useRef,useState} from 'react';
import {beginRecordSave,readSavedRecord,recordChanged,validateRecord,type RecordKind,type PendingSave} from '@/lib/record-editor';
import {claimTarget} from '@/lib/task-claims';

export function useRecordEditor<T extends {id:string;title:string;status:string},D>({kind,onReadback,onSaved}:{kind:RecordKind;onReadback:(data:D)=>void;onSaved:(message:string)=>void}){
  const taskClaim=useTaskClaim();
  const dialog=useRef<HTMLDialogElement>(null),busy=useRef(false);
  const [selected,setSelected]=useState<T|null>(null),[baseline,setBaseline]=useState<T|null>(null),[editRevision,setEditRevision]=useState(0),[accepted,setAccepted]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState<PendingSave|null>(null),[discardPrompt,setDiscardPrompt]=useState(false),[copyNotice,setCopyNotice]=useState('');
  const dirty=recordChanged(kind,selected,baseline),locked=saving||!!pending;
  useEffect(()=>{if(!dirty&&!pending&&!taskClaim.proof&&!taskClaim.request.current)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty,pending,taskClaim.proof,taskClaim.busy]);
  const reset=()=>{dialog.current?.close();setSelected(null);setBaseline(null);setError('');setPending(null);setAccepted(false);setDiscardPrompt(false);setCopyNotice('')};
  const open=(record:T,revision:number)=>{if(busy.current)return;if(taskClaim.held.current||taskClaim.request.current){setError('Finish the current claim action and release it before changing records.');return;}if(selected&&(dirty||pending)){setError('Save or close the current draft before opening a connected record.');return}setSelected({...record});setBaseline({...record});setEditRevision(revision);setAccepted(false);setError('');setPending(null);setDiscardPrompt(false);setCopyNotice('');dialog.current?.showModal()};
  const close=()=>{if(busy.current)return;if(taskClaim.held.current||taskClaim.request.current){setError('Release this task claim before closing. Do not abandon uncertain work.');return;}if(dirty||pending){setDiscardPrompt(true);return}reset()};
  const update=(record:T)=>{if(locked)return;setSelected(record);setAccepted(false);setError('');setCopyNotice('')};
  const confirmReadback=async(receipt:PendingSave)=>{const result=await readSavedRecord(kind,receipt);onReadback(result.data as D);const title=selected?.title??receipt.id;await taskClaim.release(claimTarget(kind,receipt.id));reset();onSaved(`Saved and checked: ${title} (${receipt.id}).`)};
  const save=async()=>{
    if(busy.current||!selected||!dirty||pending)return;
    if(!taskClaim.proof){setError('Acquire and verify this task claim before saving.');return;}
    const message=validateRecord(kind,selected,accepted);if(message){setError(message);return}
    busy.current=true;setSaving(true);setError('');setDiscardPrompt(false);
    try{const result=await beginRecordSave(kind,selected,editRevision,accepted,fetch,taskClaim.proof??undefined);setPending(result.pending);if(result.error){setError(result.error);return}if(result.pending)await confirmReadback(result.pending)}catch(e){setError((e as Error).message||'The saved update could not be checked. Your draft is kept here.')}finally{busy.current=false;setSaving(false)}
  };
  const verify=async()=>{if(!pending||busy.current)return;busy.current=true;setSaving(true);setError('');try{await confirmReadback(pending)}catch(e){setError((e as Error).message||'The saved update could not be checked.')}finally{busy.current=false;setSaving(false)}};
  const copyDraft=async()=>{if(!selected)return;try{await navigator.clipboard.writeText(JSON.stringify(selected,null,2));setCopyNotice('Draft copied.')}catch{setCopyNotice('Clipboard access is unavailable. Select and copy your notes before closing.')}};
  const target=(id:string)=>claimTarget(kind,id);
  return {taskClaim:{...taskClaim,acquire:(id:string)=>taskClaim.acquire(target(id)),recover:(id:string)=>taskClaim.recover(target(id)),heartbeat:(id:string)=>taskClaim.heartbeat(target(id)),release:(id:string)=>{if(busy.current||pending)return Promise.reject(Error('Finish saved-record verification before releasing the claim.'));return taskClaim.release(target(id))}},dialog,selected,baseline,editRevision,accepted,setAccepted,saving,error,pending,discardPrompt,setDiscardPrompt,copyNotice,dirty,locked,open,close,update,save,verify,copyDraft,discard:()=>{if(!busy.current&&!taskClaim.held.current&&!taskClaim.request.current)reset();else setError('Release the claim before discarding.');}};
}
