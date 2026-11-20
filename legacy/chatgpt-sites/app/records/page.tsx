import Dashboard from '../dashboard';
import {requireChatGPTUser} from '../chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Records(){await requireChatGPTUser('/records');return <><div style={{padding:'14px 24px',background:'#e8d7ac',position:'relative',zIndex:20}}><a href="/">← Back to your simple dashboard</a> · Original task records and technical detail. Your existing updates and decisions are preserved here.</div><Dashboard/></>}
