'use client';
import {useSyncExternalStore} from 'react';
let clock=Date.now();
const listeners=new Set<()=>void>();
let timer:ReturnType<typeof setInterval>|undefined;
function subscribeClock(notify:()=>void){
 listeners.add(notify);
 if(!timer){clock=Date.now();timer=setInterval(()=>{clock=Date.now();listeners.forEach(fn=>fn())},1000)}
 return()=>{listeners.delete(notify);if(!listeners.size){clearInterval(timer);timer=undefined}};
}
export function useCurrentTime(){return useSyncExternalStore(subscribeClock,()=>clock,()=>0)}
const subscribeCapabilities=(notify:()=>void)=>{window.addEventListener('focus',notify);return()=>window.removeEventListener('focus',notify)};
const noCapabilities=()=>false;
const speechOutput=()=>typeof window!=='undefined'&&'speechSynthesis' in window;
type SpeechWindow=Window&{SpeechRecognition?:unknown;webkitSpeechRecognition?:unknown};
const speechInput=()=>typeof window!=='undefined'&&!!((window as SpeechWindow).SpeechRecognition||(window as SpeechWindow).webkitSpeechRecognition);
export function useSpeechOutput(){return useSyncExternalStore(subscribeCapabilities,speechOutput,noCapabilities)}
export function useSpeechInput(){return useSyncExternalStore(subscribeCapabilities,speechInput,noCapabilities)}
const subscribeHash=(notify:()=>void)=>{window.addEventListener('hashchange',notify);window.addEventListener('popstate',notify);return()=>{window.removeEventListener('hashchange',notify);window.removeEventListener('popstate',notify)}};
export function useLocationHash(){return useSyncExternalStore(subscribeHash,()=>window.location.hash,()=> '')}
