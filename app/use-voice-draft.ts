'use client';
import {useEffect,useRef,useState} from 'react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type VoiceWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export const voiceError=(error:string)=>error==='not-allowed'||error==='service-not-allowed'?'Microphone access was denied or unavailable in this panel. You can type, or open the dashboard in a full browser tab and allow the microphone.':error==='no-speech'?'No speech was detected. Your draft is still here.':error==='audio-capture'?'No microphone is available. You can keep typing.':error==='network'?'The browser’s speech service could not connect. Your draft is still here.':'Dictation stopped. Review your draft before sending.';
export function useVoiceDraft(draft:string,setDraft:(value:string)=>void,active:boolean){
 const [supported,setSupported]=useState(false),[listening,setListening]=useState(false),[note,setNote]=useState('');
 const recognition=useRef<Recognition|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),current=useRef(draft);
 current.current=draft;
 const stop=()=>{const r=recognition.current;recognition.current=null;if(timer.current)clearTimeout(timer.current);timer.current=null;if(r){r.onresult=null;r.onend=null;r.onerror=null;try{r.abort()}catch{}}setListening(false);};
 useEffect(()=>{const w=window as VoiceWindow;setSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));const visibility=()=>{if(document.hidden)stop()};document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('visibilitychange',visibility);stop()}},[]);
 useEffect(()=>{if(!active)stop()},[active]);
 const toggle=()=>{
  if(recognition.current){try{recognition.current.stop()}catch{stop()}return;}
  const w=window as VoiceWindow,Constructor=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Constructor){setNote('Voice dictation is unavailable in this browser. You can type your message.');return;}
  const r=new Constructor(),prefix=current.current.trimEnd();recognition.current=r;r.lang='en-US';r.continuous=true;r.interimResults=true;setNote('Listening. Stop when you are finished, then review your words.');setListening(true);
  r.onresult=e=>{const spoken=Array.from(e.results).map(v=>v[0]?.transcript??'').join(' ').trim();setDraft((prefix+(prefix&&spoken?' ':'')+spoken).slice(0,2000));};
  r.onerror=e=>{setNote(voiceError(e.error));stop()};
  r.onend=()=>{stop();setNote('Dictation ended. Review your words before continuing.');};
  try{r.start();timer.current=setTimeout(()=>{try{r.stop()}catch{stop()}},60000)}catch{stop();setNote('The microphone could not start. You can type or open the dashboard in a full browser tab.');}
 };
 return {supported,listening,note,toggle,stop};
}
