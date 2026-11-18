import {avengers} from './avengers';
const assetIds:Record<string,string>={coach:'coach-drew',drew:'drew-2',atlas:'atlas-prime',mansa:'mansa-musa'};
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
export function avengerForOwner(owner:string){const value=normalize(owner);const aliases:Record<string,string>={drew20:'drew',drew2:'drew',dexthebest:'dex',codex:'dex',mansamusa:'mansa',coachdrew:'coach',atlasprime:'atlas'};return avengers.find(a=>a.id===(aliases[value]??value)||normalize(a.name)===value)}
export function portraitPath(id:string,variant:'bubble'|'card'){return avengers.some(a=>a.id===id)?`/images/avengers-v1.3/${assetIds[id]??id}-${variant}.png`:null}
export function identityInitials(name:string){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]??'').join('').toUpperCase()||'?'}
