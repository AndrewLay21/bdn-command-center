/**
 * Who is on the team. Presentation only: this list never creates workers,
 * changes owners, or claims that any agent is connected.
 * "original" = roster from the old ChatGPT Command Center (legacy/chatgpt-sites/lib/avengers.ts).
 * "current"  = Coach Drew's Grok Bot team.
 */
export type Agent = {
  id: string;
  name: string;
  role: string;
  platform: string;
  initials: string;
  group: "founder" | "current" | "original";
  image: string | null;
  /** Extra owner names used in the saved records that mean this agent. */
  aliases?: string[];
  note?: string;
};

const legacy = (file: string) => `/images/avengers-v1.3/${file}-card.png`;
const team = (file: string) => `/images/team/${file}.webp`;

export const agents: Agent[] = [
  { id: "coach", name: "Coach Drew", platform: "Founder", role: "Strategy & final releases", initials: "CD", group: "founder", image: legacy("coach-drew") },

  { id: "zeus", name: "Zeus", platform: "Grok Bot", role: "Chief of Staff · team lead", initials: "ZS", group: "current", image: team("zeus"), note: "Earlier roster role: Video & YouTube operations." },
  { id: "thoth", name: "Thoth", platform: "Grok Bot", role: "Weekly blog, Rundown newsletter & parent tip", initials: "TH", group: "current", image: team("thoth") },
  { id: "horus", name: "Horus", platform: "Grok Bot", role: "Clips", initials: "HO", group: "current", image: team("horus") },
  { id: "imhotep", name: "Imhotep", platform: "Grok Bot", role: "Long-form video editor", initials: "IM", group: "current", image: team("imhotep") },
  { id: "care", name: "Care", platform: "Grok Bot", role: "Parent help desk · drafts only", initials: "CA", group: "current", image: team("care") },
  { id: "ref", name: "Ref", platform: "Grok Bot", role: "QA & independent verification", initials: "RF", group: "current", image: team("ref") },
  { id: "safety", name: "Safety", platform: "Grok Bot", role: "Security & privacy review", initials: "SF", group: "current", image: team("safety") },

  { id: "drew", name: "Drew 2.0", platform: "Executive operations", role: "Editorial & production coordination", initials: "D2", group: "original", image: legacy("drew-2"), aliases: ["Drew2.0", "Drew 2"] },
  { id: "dex", name: "Dex the Best", platform: "OpenAI Codex", role: "Engineering ownership & verification", initials: "DX", group: "original", image: legacy("dex"), aliases: ["Codex"] },
  { id: "vision", name: "Vision", platform: "Claude Design", role: "Visual design & UX", initials: "VI", group: "original", image: legacy("vision") },
  { id: "levels", name: "Levels", platform: "Google Antigravity", role: "Visual & coding execution", initials: "LV", group: "original", image: legacy("levels") },
  { id: "atlas", name: "Atlas Prime", platform: "OpenAI Platform", role: "API infrastructure", initials: "AP", group: "original", image: legacy("atlas-prime") },
  { id: "forge", name: "Forge", platform: "Claude Code", role: "Technical engineering", initials: "FG", group: "original", image: legacy("forge") },
  { id: "lens", name: "Lens", platform: "Claude browser extension", role: "Browser analysis", initials: "LN", group: "original", image: legacy("lens") },
  { id: "sage", name: "Sage", platform: "Claude Chat", role: "Research, strategy & writing", initials: "SG", group: "original", image: legacy("sage") },
  { id: "nova", name: "Nova", platform: "Google Gemini", role: "Multimodal analysis", initials: "NV", group: "original", image: legacy("nova") },
  { id: "radar", name: "Radar", platform: "Perplexity Free", role: "Public research", initials: "RD", group: "original", image: legacy("radar") },
  { id: "professor", name: "Professor", platform: "NotebookLM", role: "Education & knowledge", initials: "PR", group: "original", image: legacy("professor") },
  { id: "mansa", name: "Mansa Musa", platform: "Social execution", role: "Approved publishing & receipts", initials: "MM", group: "original", image: legacy("mansa-musa") },
  { id: "oasis", name: "Oasis", platform: "ChatGPT", role: "Strategic coordination", initials: "OS", group: "original", image: legacy("oasis") },
  { id: "vanguard", name: "Vanguard", platform: "ChatGPT Work", role: "Execution coordination", initials: "VG", group: "original", image: legacy("vanguard") },
];

export const workers = agents.filter((a) => a.group !== "founder");

export function agentById(id: string) {
  return agents.find((a) => a.id === id);
}

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Does a saved owner field (e.g. "Coach Drew / Drew2.0") name this agent? */
export function ownerMatches(owner: string | null | undefined, agent: Agent) {
  if (!owner) return false;
  const names = [agent.name, agent.id, ...(agent.aliases ?? [])].map(norm);
  return owner.split(/[\/+,&]| and /i).map(norm).some((part) => part && names.includes(part));
}

export function agentForOwner(owner: string | null | undefined) {
  return agents.find((a) => ownerMatches(owner, a));
}

export function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase() || "?";
}
