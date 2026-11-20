import "server-only";
import mapping from "../t3-agents.json";

export type AgentMapping = { provider: string[]; status: "connected" | "not_connected"; note?: string };

type MappingFile = {
  agents: Record<string, AgentMapping>;
  providersOn?: string[];
};

const file = mapping as unknown as MappingFile;

/** The mapping for one Command Center agent id, or null when it isn't mapped (= not connected). */
export function agentMapping(agentId: string): AgentMapping | null {
  const m = file.agents?.[agentId];
  if (!m || m.status !== "connected" || !Array.isArray(m.provider) || m.provider.length === 0) return null;
  return m;
}

/** True when this agent id is wired to a T3 provider in t3-agents.json. */
export function isAgentConnected(agentId: string): boolean {
  return agentMapping(agentId) !== null;
}

export function connectedAgentIds(): string[] {
  return Object.keys(file.agents ?? {}).filter((id) => isAgentConnected(id));
}
