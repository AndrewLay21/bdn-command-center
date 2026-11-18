'use client';
import {useState} from 'react';
import Image from 'next/image';
import {avengerForOwner,identityInitials,portraitPath} from '@/lib/avenger-portraits';
import type {Avenger} from '@/lib/avengers';
export default function AgentPortrait({agent,owner,size=40,variant='bubble'}:{agent?:Avenger;owner?:string;size?:32|40|48|96;variant?:'bubble'|'card'}){
 const person=agent??avengerForOwner(owner??''),name=person?.name??owner??'Unassigned';const src=person?portraitPath(person.id,variant):null;
 const [failedSource,setFailedSource]=useState<string|null>(null);const shown=!!src&&failedSource!==src,width=variant==='card'?(size===96?96:88):size,height=width;
 return <span className={'ap-portrait ap-'+variant} style={{width,height}} role="img" aria-label={name+' identity'} data-image-state={shown?'image':'initials'}>{shown?<Image src={src} alt="" aria-hidden="true" width={width} height={height} unoptimized onError={()=>setFailedSource(src)}/>:<span aria-hidden="true">{person?.initials??identityInitials(name)}</span>}</span>;
}
