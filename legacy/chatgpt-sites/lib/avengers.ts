import type {ChatAgentId} from './chat-agents';
export type Avenger={id:string;name:string;platform:string;role:string;initials:string;chat?:ChatAgentId};
// Presentation identity only. Never creates workers, rewrites owners or asserts connectivity.
export const avengers:Avenger[]=[
{id:'coach',name:'Coach Drew',platform:'Founder',role:'Strategy & final releases',initials:'CD'},
{id:'drew',name:'Drew 2.0',platform:'Executive operations',role:'Editorial & production coordination',initials:'D2',chat:'drew'},
{id:'dex',name:'Dex the Best',platform:'OpenAI Codex',role:'Engineering ownership & verification',initials:'DX',chat:'dex'},
{id:'vision',name:'Vision',platform:'Claude Design',role:'Visual design & UX',initials:'VI'},
{id:'levels',name:'Levels',platform:'Google Antigravity',role:'Visual & coding execution',initials:'LV'},
{id:'atlas',name:'Atlas Prime',platform:'OpenAI Platform',role:'API infrastructure',initials:'AP'},
{id:'forge',name:'Forge',platform:'Claude Code',role:'Technical engineering',initials:'FG'},
{id:'lens',name:'Lens',platform:'Claude browser extension',role:'Browser analysis',initials:'LN'},
{id:'sage',name:'Sage',platform:'Claude Chat',role:'Research, strategy & writing',initials:'SG'},
{id:'nova',name:'Nova',platform:'Google Gemini',role:'Multimodal analysis',initials:'NV'},
{id:'radar',name:'Radar',platform:'Perplexity Free',role:'Public research',initials:'RD'},
{id:'professor',name:'Professor',platform:'NotebookLM',role:'Education & knowledge',initials:'PR'},
{id:'zeus',name:'Zeus',platform:'Media operations',role:'Video & YouTube operations',initials:'ZS'},
{id:'mansa',name:'Mansa Musa',platform:'Social execution',role:'Approved publishing & receipts',initials:'MM',chat:'mansa'},
{id:'oasis',name:'Oasis',platform:'ChatGPT',role:'Strategic coordination',initials:'OS'},
{id:'vanguard',name:'Vanguard',platform:'ChatGPT Work',role:'Execution coordination',initials:'VG'}];
