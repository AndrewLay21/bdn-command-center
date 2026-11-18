import {founderDecisionRecordedAt,founderPortfolioDefaults} from '@/lib/daily-audit';
import plan from '@/lib/tradelab-plan.json';

const tradeIds=new Set([plan.projectId,plan.nextStepId,plan.chartRecordId]);
type Fields=Record<string,unknown> & {id?:string;updatedAt?:string};
// Preserve saved history. A later explicit founder decision only supersedes older display values.
export function mergePortfolioItem(item:Fields,manual?:Fields,projected?:Fields){
 if(tradeIds.has(item.id??'')){
  const newer=(v?:Fields)=>v?.updatedAt&&Date.parse(v.updatedAt)>=Date.parse(plan.recordedAt)?v:undefined;
  return {...item,...newer(projected),...newer(manual)};
 }
 const decision=founderPortfolioDefaults[item.id??''];
 const olderManual=decision&&manual&&(!manual.updatedAt||Date.parse(manual.updatedAt)<Date.parse(founderDecisionRecordedAt));
 return olderManual?{...item,...manual,...decision,...projected}:{...item,...decision,...projected,...manual};
}
