import type {PortfolioItem} from './portfolio-types';

// Compare explicit record IDs only. Do not guess a task from its wording or change history.
export function auditActionView(text:string,items:PortfolioItem[]|undefined){
 const ids=[...new Set(text.match(/\b(?:[A-Z]{1,8}-\d+|[A-Z]\d{2,})\b/g)??[])];
 const records=ids.flatMap(id=>items?.filter(item=>item.id===id)??[]);
 const closed=records.filter(item=>item.status==='Done'&&item.proof.trim().length>=20);
 return {closed,allClosed:ids.length>0&&closed.length===ids.length};
}
