import {z} from 'zod';
export const excludedTicketParents=['X46','X73','X74'];
export const ticketStates=['Draft','Assigned','In progress','Blocked','Hold','Review','Done'] as const;
export const ticketFields=['title','parentKind','parentId','agent','deliverable','priority','deadline','dependencies','status','progress','blocker','nextAction','evidence','reviewer'] as const;
export const ticketSchema=z.object({id:z.string().uuid(),revision:z.number().int().min(0),accepted:z.boolean(),title:z.string().trim().min(3).max(180),parentKind:z.enum(['portfolio','original']),parentId:z.string().min(1).max(50),agent:z.string().trim().max(120),deliverable:z.string().trim().min(10).max(2000),priority:z.enum(['High','Normal','Low']),deadline:z.union([z.string().datetime({offset:true}),z.literal('')]),dependencies:z.array(z.string().uuid()).max(30),status:z.enum(ticketStates),progress:z.string().max(4000),blocker:z.string().max(2000),nextAction:z.string().trim().min(3).max(2000),evidence:z.string().max(6000),reviewer:z.string().trim().max(120)}).strict();
export type Ticket=Omit<z.infer<typeof ticketSchema>,'revision'|'accepted'>&{code?:string;createdAt?:string;updatedAt?:string};
export type TicketHistory={id:string;ticketId:string;at:string;by:string;accepted:boolean;snapshot:Ticket};
export type TicketData={revision:number;items:Ticket[];history:TicketHistory[]};
export const emptyTicket=():Ticket=>({id:crypto.randomUUID(),title:'',parentKind:'portfolio',parentId:'',agent:'',deliverable:'',priority:'Normal',deadline:'',dependencies:[],status:'Draft',progress:'',blocker:'',nextAction:'',evidence:'',reviewer:''});
export function ticketError(t:Ticket,accepted:boolean,items:Ticket[]=[]){
 if(t.status!=='Draft'&&!t.agent)return 'Assign one responsible agent before moving this ticket out of Draft.';
 if(t.status==='Blocked'&&!t.blocker.trim())return 'Describe the blocker and what is needed to resolve it.';
 if(['Review','Done'].includes(t.status)&&t.evidence.trim().length<20)return 'Add specific evidence and the exact deliverable version before review.';
 if(t.status==='Done'&&(!accepted||!t.reviewer||t.reviewer.toLowerCase()===t.agent.toLowerCase()))return 'Completion requires a named reviewer other than the assigned agent and confirmed acceptance.';
 if(t.dependencies.includes(t.id))return 'A ticket cannot depend on itself.';
 if(t.dependencies.some(id=>!items.some(i=>i.id===id)))return 'A dependency was not found.';
 if(['In progress','Review','Done'].includes(t.status)&&t.dependencies.some(id=>items.find(i=>i.id===id)?.status!=='Done'))return 'Finish the prerequisite tickets before advancing this task.';
 const visit=(id:string,seen:Set<string>):boolean=>{if(id===t.id)return true;if(seen.has(id))return false;seen.add(id);return (items.find(i=>i.id===id)?.dependencies??[]).some(next=>visit(next,seen))};
 if(t.dependencies.some(id=>visit(id,new Set())))return 'These dependencies would create a cycle.';
 if(items.some(i=>i.id!==t.id&&i.parentKind===t.parentKind&&i.parentId===t.parentId&&i.title.trim().toLowerCase()===t.title.trim().toLowerCase()))return 'A ticket with this title already exists for that parent. Update the existing ticket.';
 return '';
}
