export const rosterAgentIds = ['drew','dex','vision','levels','atlas','forge','lens','sage','nova','radar','professor','zeus','mansa','oasis','vanguard'] as const;
export type RosterAgentId = typeof rosterAgentIds[number];
export const isRosterAgent = (value: unknown): value is RosterAgentId => typeof value === 'string' && rosterAgentIds.includes(value as RosterAgentId);
export type AgentDraft = {text:string; savedAt:string; requestId:string};
export type InboxDrafts = Partial<Record<RosterAgentId,AgentDraft>>;
export type AgentConnection = {agent:RosterAgentId; threadId:string; connected:boolean; canSend:boolean; historyAvailable:boolean; unread:number|null; needsReply:boolean|null; reason:string};
export type InboxFeed = {revision:number; drafts:InboxDrafts; connections:AgentConnection[]};
// Explicitly authorized, read back from the existing native chat. This is
// historical connection evidence, not an application send/receive adapter.
export const verifiedNativeThreads = {
 vanguard: {
  title:'Mission Control Redesign Update',
  url:'https://chatgpt.com/c/6af71927-e9a0-83ea-9994-6878fcc7781d',
  correlationId:'TKT-0009-NATIVE-ACK-20261114-G23',
  messageId:'b8b5bfd4-7d2c-5b9d-9dbf-ded8492e5797',
  acknowledgedAt:'2026-11-14T03:25:26.185Z',
 },
} as const;

// No external transport has an authenticated application adapter. Native tool
// access and the legacy paid dashboard roles are not agent delivery channels.
export function agentConnections(): AgentConnection[] {
 return rosterAgentIds.map(agent=>({agent,threadId:'agent:v1:'+agent,connected:false,canSend:false,historyAvailable:false,unread:null,needsReply:null,reason:agent==='professor'?'NotebookLM identity is a knowledge tool; no autonomous messaging endpoint is verified.':'No authenticated agent messaging adapter is installed in this application.'}));
}
