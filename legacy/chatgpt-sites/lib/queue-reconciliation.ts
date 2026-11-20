/** Exact owner override reconciliation. Read-only projection until an explicit, claimed review is saved. */
import seed from '@/lib/seed.json';
// Evidence-only appends retain an existing review. Any authority/status/date/note
// change or evidence replacement requires another exact, claimed review.
export const reviewedOverrideSQL=(review='q.override_json',current='o.value')=>`(json_remove(${review},'$.evidence','$.updated')=json_remove(${current},'$.evidence','$.updated') AND substr(COALESCE(json_extract(${current},'$.evidence'),''),1,length(COALESCE(json_extract(${review},'$.evidence'),'')))=COALESCE(json_extract(${review},'$.evidence'),''))`;
export const unresolvedOverridesSQL=`EXISTS(SELECT 1 FROM dashboards d,json_each(d.payload,'$.overrides') o WHERE d.user_id=? AND NOT EXISTS(SELECT 1 FROM queue_reconciliations q WHERE q.owner_id=d.user_id AND q.task_id=o.key AND ${reviewedOverrideSQL()}))`;
export async function overrideDigest(value:unknown){const bytes=new TextEncoder().encode(JSON.stringify(value));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
export function isCleanupCandidate(id:string,value:unknown){
 if(!seed.some(t=>t.id===id)||!value||typeof value!=='object'||Array.isArray(value))return false;
 return true;
}
export function parseOverrides(payload:string){const data=JSON.parse(payload);if(!data||!data.overrides||Array.isArray(data.overrides)||typeof data.overrides!=='object')throw Error('Unrecognized original record payload');return data.overrides as Record<string,unknown>}
