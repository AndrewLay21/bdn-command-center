import {z} from 'zod';
import portfolio from './portfolio.json';

export const dailyAuditKey='system:keep-me-on-track:v1';
const text=z.string().trim().min(1).max(2000);
const iso=z.string().datetime({offset:true});
export const auditSource=z.object({label:z.string().trim().min(1).max(180),url:z.string().url().refine(v=>v.startsWith('https://'),'Use a secure source link')}).strict();
const excluded=new Set(['C01','A29','X31','GAP-01','GAP-02','GAP-03']);
const solutions=new Set(['C02','X52','GAP-04','GAP-05']);
export const auditRecordUpdate=z.object({
 id:z.string().refine(id=>portfolio.items.some(i=>i.id===id)&&!excluded.has(id),'Use an existing record outside Kev’s AC Assurance lane'),
 status:z.enum(['Needs review','Working on it','Waiting','Parked','Reference']),
 nextStep:text,note:text,proof:z.string().trim().min(20).max(3000),observedAt:iso
}).strict();
export const auditSnapshotSchema=z.object({
 kind:z.enum(['setup','morning','afternoon','closeout']),asOf:iso,
 summary:z.string().trim().min(20).max(1800),coachActions:z.array(text).max(3),
 completed:z.array(text).max(20),inProgress:z.array(text).max(20),gaps:z.array(text).max(20),next:z.array(text).max(20),
 workout:z.string().max(5000).optional(),sources:z.array(auditSource).min(1).max(30),
 recordUpdates:z.array(auditRecordUpdate).max(40).optional()
}).strict().superRefine((s,ctx)=>{
 const seen=new Set<string>();
 for(const [i,u] of (s.recordUpdates??[]).entries()){
  if(seen.has(u.id))ctx.addIssue({code:z.ZodIssueCode.custom,path:['recordUpdates',i,'id'],message:'Duplicate record ID'});
  seen.add(u.id);
  if(Date.parse(u.observedAt)>Date.parse(s.asOf))ctx.addIssue({code:z.ZodIssueCode.custom,path:['recordUpdates',i,'observedAt'],message:'Observation cannot follow the audit cutoff'});
  if(solutions.has(u.id)&&Date.parse(s.asOf)<Date.parse('2026-10-29T12:00:00Z'))ctx.addIssue({code:z.ZodIssueCode.custom,path:['recordUpdates',i,'id'],message:'Solutions Legal is deferred until October 29 at 8 a.m. Eastern'});
 }
});
export const auditRequestSchema=z.object({revision:z.number().int().min(0),runId:z.string().regex(/^[A-Za-z0-9:_-]{8,120}$/),snapshot:auditSnapshotSchema}).strict();
export type AuditSnapshot=z.infer<typeof auditSnapshotSchema>;
export type AuditRecordUpdate=z.infer<typeof auditRecordUpdate>;
export type AuditHistory={runId:string;requestHash:string;kind:AuditSnapshot['kind'];asOf:string;savedAt:string;summary:string;sources:z.infer<typeof auditSource>[]};
export type AuditState={snapshot:AuditSnapshot|null;history:AuditHistory[];recordUpdates:AuditRecordUpdate[]};
export type AuditFeed={revision:number;checkedAt:string|null;snapshot:AuditSnapshot|null;history:AuditHistory[]};
export const emptyAudit=():AuditState=>({snapshot:null,history:[],recordUpdates:[]});

export function mergeAuditUpdates(prior:AuditRecordUpdate[],incoming:AuditRecordUpdate[]){
 const map=new Map(prior.map(v=>[v.id,v]));
 for(const update of incoming){const current=map.get(update.id);if(!current||Date.parse(update.observedAt)>=Date.parse(current.observedAt))map.set(update.id,update)}
 return [...map.values()];
}

export function auditWriteDecision(state:AuditState,revision:number,input:z.infer<typeof auditRequestSchema>,requestHash:string,now:number){
 const prior=state.history.find(v=>v.runId===input.runId);
 if(prior)return prior.requestHash===requestHash?'duplicate':'run-conflict';
 if(input.revision!==revision)return 'revision-conflict';
 if(Date.parse(input.snapshot.asOf)>now+300000)return 'future';
 if(state.snapshot&&Date.parse(input.snapshot.asOf)<Date.parse(state.snapshot.asOf))return 'stale';
 return 'write';
}

export const founderDecisionRecordedAt='2026-10-28T14:27:48.125Z';
export const founderPortfolioDefaults:Record<string,Record<string,string>>={
 C01:{owner:'Kev',status:'Waiting',nextStep:'Kev owns all AC Assurance work. No action or repeated review is assigned to Coach Drew, Drew 2.0 or Mansa.',note:'October 28 founder decision: delegated to Kev; this does not claim the client work is complete.'},
 X31:{owner:'Kev',status:'Reference',nextStep:'Historical AC Assurance evidence. Kev owns the current work; do not reopen it for the audit team.'},
 A29:{nextStep:'Historical client and website work. AC Assurance is delegated to Kev; other former client projects are history unless Coach changes their status.'},
 ...Object.fromEntries(['GAP-01','GAP-02','GAP-03'].map(id=>[id,{owner:'Kev',status:'Waiting',priority:'Delegated',nextStep:'Kev owns this AC Assurance work. Keep the historical finding without auditing, reminding or reassigning it.',note:'Current founder override, October 28: excluded from this agent queue. Completion has not been inferred.'}])),
 ...Object.fromEntries(['C02','X52','GAP-04','GAP-05'].map(id=>[id,{status:'Waiting',nextStep:'Deferred until October 29 at 8 a.m. Eastern. Use any actual Coach follow-up and the existing checklist; no automatic contact or duplicate checklist.',note:'October 28 founder decision. Contact has not been confirmed. The separate reminder is paused; do not reactivate it.'}]))
};

export const auditInstructions={
 protectedSchedule:'Read GET /api/weekly-plan before capacity planning. A30 / GAP-53 / X77 are resumed GBP/JPY-only simulated education. Weekday 08:00–12:00 America/New_York is protected indefinitely from October 28, 2026. Do not allocate other Coach work in that window or reopen old trading approaches. Calendar conflict check is dated; two possible show/radio overlaps need Coach’s decision. No dependable trading income. Preserve owner decisions and do not claim agent activity, attendance or implemented risk safeguards.',
 version:1,
 access:'Call Sites get_site for appgprj_6ace4a47b23881918a00ef6e8aff6542. Confirm owner-private: only owner, no external visitors, editors or groups. Obtain its current service bearer in memory and send only to this Site as OAI-Sites-Authorization: Bearer <token>. No credentials in files, prompts or output. Stop writes if audience expands. This endpoint relies on that same platform boundary as the existing Coach Core feed.',
 read:'GET /api/daily-audit for revision, latest snapshot, prior summaries and this contract. A setup snapshot and saved schedule are not proof that a scheduled audit ran. Read current sources and preserve their dates.',
 write:'POST application/json {revision,runId,snapshot}; runId is a unique 8–120 character alphanumeric/colon/underscore/hyphen identifier for this scheduled occurrence. Use the same runId and exact snapshot on a retry. Successful identical retries are idempotent. On a revision conflict, reread and reconcile once. Read back the stored snapshot after save. Do not invent or roll timestamps forward.',
 snapshotContract:{kind:'setup | morning | afternoon | closeout',asOf:'ISO 8601 timestamp with timezone: evidence cutoff, no more than five minutes in future',summary:'20–1800 characters',coachActions:'array of 0–3 nonempty strings, max 2000 characters each',completed:'array of 0–20 source-supported result strings',inProgress:'array of 0–20 strings; claim active work only with evidence',gaps:'array of 0–20 specific blocker/unknown strings',next:'array of 0–20 actionable strings',workout:'optional string, max 5000 characters',sources:'1–30 {label: 1–180 characters,url: https URL}',recordUpdates:'optional array of 0–40 {id,status,nextStep,note,proof,observedAt}; known portfolio IDs only; status Needs review | Working on it | Waiting | Parked | Reference; nextStep/note 1–2000 characters; proof 20–3000 characters with concrete dated source; observedAt ISO no later than asOf. No owner changes or Done status.'},
 example:{revision:0,runId:'2026-10-29:morning',snapshot:{kind:'morning',asOf:'2026-10-29T08:00:00-04:00',summary:'Read the current sources and replace this example with a supported summary.',coachActions:[],completed:[],inProgress:[],gaps:[],next:[],sources:[{label:'Current gap map',url:'https://chatgpt.com/library?file_id=libfile_06661e9ed6c4819187167809f9e534ac&account_id=personal'}]}},
 ownership:'AC Assurance C01/A29/X31/GAP-01–03 is excluded from automatic updates and execution; Kev owns it. Solutions C02/X52/GAP-04–05 deferred until October 29 at 8 a.m. Eastern, then use actual follow-up evidence only. Preserve all other owners, review work and pauses. Record updates are evidence projections; private owner edits newer than the October 28 recorded founder override win; older conflicting edits remain stored but the newer founder decision is displayed. Agents cannot mark portfolio records Done.',
 scope:'Run authorized research, drafts, verification and preparation, then continue the next eligible task during an active run. No promise of continuous runtime. The service feed does not expose signed-in private card edits; use readable current owner records and do not duplicate work when ownership is unverified. This audit authorization does not restart paused publishing, send messages, buy, submit applications, change permissions or approve releases. Retain Coach Core MVP NO-GO and AI OFF unless an explicit later authorized decision changes them.',
 output:'Plain language: Coach’s next three actions; completed with proof; actual work in progress; gaps; next actions. Morning includes an indoor workout. Do not expose raw credentials, private messages or sensitive personal data.'
};
