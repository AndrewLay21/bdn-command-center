/** Administrative date cleanup is separate from task acceptance and freshness. */
export type DeadlineClear = { previousDeadline: string; clearedAt: string };
export function applyDeadlineClear<T extends {deadline?:string;deadlineConfirmed?:boolean}>(task:T, clear?:DeadlineClear):T {
 if(!clear || task.deadlineConfirmed || task.deadline!==clear.previousDeadline)return task;
 return {...task,deadline:'',deadlineConfirmed:false};
}
