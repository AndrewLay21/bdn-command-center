'use client';
import {useState} from 'react';
import Image from 'next/image';
import {platformAssets} from '@/lib/platform-assets';
export default function PlatformEmblem({id,size=32}:{id:string;size?:24|32|40|48}){
 const asset=platformAssets[id],src=asset?'/images/platforms-v1.3/'+asset.file+'.png':null;
 const [failed,setFailed]=useState<string|null>(null),label=asset?.label??id;
 return <span className="ex-emblem" style={{width:size,height:size}} role="img" aria-label={label+' draft custom emblem'}>{src&&failed!==src?<Image src={src} alt="" aria-hidden="true" width={size} height={size} unoptimized onError={()=>setFailed(src)}/>:<span aria-hidden="true">{label.split(/\s+/).slice(0,2).map(s=>s[0]).join('')}</span>}</span>;
}
