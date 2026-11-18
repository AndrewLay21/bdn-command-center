// New reports supersede older status edits; later owner edits always win.
// Original overrides/history remain stored unchanged in D1.
export function reconcileTask<T extends {updated:string}>(baseline:T, override?:Partial<T>):T {
 if(!override)return baseline;
 if(!override.updated || Date.parse(override.updated)>=Date.parse(baseline.updated))return {...baseline,...override};
 const saved=override as Partial<T>&{deadlineConfirmed?:boolean;deadline?:string};
 return saved.deadlineConfirmed?{...baseline,deadline:saved.deadline,deadlineConfirmed:true}:baseline;
}
