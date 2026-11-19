import type {PortfolioItem} from './portfolio-types';
import {agentFor} from './team-overview';

export type StepFilters={query:string;lane:string;priority:string;progress:string;owner:string;sort:string};
export const agentNames={drew:'Drew 2.0',mansa:'Mansa Musa',dex:'Dex the Best'};
export function stepOwner(owner:string){
  const agent=agentFor(owner);
  if(agent)return {key:'agent:'+agent,label:agentNames[agent],agent};
  if(!owner.trim()||owner.trim().toLowerCase()==='not confirmed')return {key:'unconfirmed',label:'Owner to confirm',agent:null};
  return {key:'owner:'+owner,label:owner,agent:null};
}
const priorityOrder:Record<string,number>={First:0,Next:1,'Only if resumed':2};
export function filterSteps(items:PortfolioItem[],filters:StepFilters){
  const query=filters.query.trim().toLowerCase();
  return items.filter(item=>item.type==='step'&&
    (filters.lane==='All areas'||item.lane===filters.lane)&&
    (filters.priority==='All priorities'||item.priority===filters.priority)&&
    (filters.progress==='Any status'||item.status===filters.progress)&&
    (filters.owner==='All owners'||stepOwner(item.owner).key===filters.owner)&&
    (!query||[item.id,item.title,item.summary,item.nextStep,item.doneMeans,item.owner,stepOwner(item.owner).label,item.lane].join(' ').toLowerCase().includes(query))
  ).sort((a,b)=>{
    if(filters.sort==='Recently updated')return (Date.parse(b.updatedAt||b.sourceDate)||0)-(Date.parse(a.updatedAt||a.sourceDate)||0)||a.id.localeCompare(b.id,undefined,{numeric:true});
    if(filters.sort==='Name A–Z')return a.title.localeCompare(b.title);
    return (priorityOrder[a.priority]??3)-(priorityOrder[b.priority]??3)||a.id.localeCompare(b.id,undefined,{numeric:true});
  });
}
export function stepStatus(status:string){
  if(status==='Done')return {tone:'done',hint:'Completion recorded',action:'Review the completion evidence'};
  if(status==='Working on it')return {tone:'working',hint:'Progress saved in the record',action:'Next action'};
  if(status==='Waiting')return {tone:'waiting',hint:'An input or decision is needed',action:'What moves this forward'};
  if(status==='Parked'||status==='Reference')return {tone:'parked',hint:'Saved for later',action:'If this resumes'};
  if(status==='Needs review')return {tone:'review',hint:'Check the latest evidence',action:'Next action'};
  return {tone:'neutral',hint:'Read the saved status',action:'Next action'};
}
