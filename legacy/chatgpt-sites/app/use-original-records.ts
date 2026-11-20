'use client';
import {useEffect,useState} from 'react';
import type {SavedTask} from '@/lib/team-overview';
export type OriginalSnapshot={tasks:(SavedTask&{priority?:string;project?:string})[];revision:number;checkedAt:string};
export function useOriginalRecords(refreshKey=0){
 const [snapshot,setSnapshot]=useState<{key:number;data:OriginalSnapshot|null;error:string}>({key:refreshKey,data:null,error:''});
 useEffect(()=>{const controller=new AbortController();fetch('/api/dashboard',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Original records could not be loaded.');const data=await response.json() as OriginalSnapshot;if(!Array.isArray(data.tasks))throw Error('Original records are unavailable.');return data}).then(data=>{if(!controller.signal.aborted)setSnapshot({key:refreshKey,data,error:''})}).catch(error=>{if(!controller.signal.aborted)setSnapshot({key:refreshKey,data:null,error:error.message})});return()=>controller.abort()},[refreshKey]);
 const current=snapshot.key===refreshKey;return {data:current?snapshot.data:null,error:current?snapshot.error:'',loading:!current||(!snapshot.data&&!snapshot.error)};
}
