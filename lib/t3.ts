import "server-only";

/**
 * Minimal T3 Code client.
 *
 * T3 Code has no plain REST API. An outside program reaches a running
 * environment through its built-in MCP server (Streamable HTTP + JSON-RPC) at
 * `<environment-address>/mcp`, authenticated with a bearer session token.
 * See T3 Code docs: `docs/user/outside-agents.md` and
 * `docs/internals/environment-auth.md`.
 *
 * Secrets live ONLY in the environment, read here on the server:
 *   T3_BASE_URL  the environment address (T3 Connect public URL), e.g.
 *                https://<name>.<tailnet-or-relay-host>  (with or without /mcp)
 *   T3_TOKEN     a bearer session token minted on the host with
 *                `t3 auth session issue --scope orchestration:read --scope orchestration:operate`
 *
 * These are never sent to the browser. Route handlers call this module only.
 */

const PROTOCOL_VERSION = "2025-06-18";

export type T3Config = { baseUrl: string; mcpUrl: string; token: string };

export function t3Config(): T3Config | null {
  const base = (process.env.T3_BASE_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.T3_TOKEN || "").trim();
  if (!base || !token) return null;
  const mcpUrl = base.endsWith("/mcp") ? base : `${base}/mcp`;
  return { baseUrl: base, mcpUrl, token };
}

export function t3Configured(): boolean {
  return t3Config() !== null;
}

export class T3Error extends Error {
  constructor(
    message: string,
    readonly kind: "not-configured" | "unreachable" | "auth" | "protocol" | "tool" = "protocol",
  ) {
    super(message);
    this.name = "T3Error";
  }
}

type JsonRpcResponse = { jsonrpc: "2.0"; id?: number; result?: unknown; error?: { code: number; message: string } };

/** Pull the matching JSON-RPC message out of a JSON or SSE (text/event-stream) body. */
function parseBody(raw: string, contentType: string, id: number): JsonRpcResponse {
  const text = raw.trim();
  if (!text) throw new T3Error("Empty response from T3.", "protocol");
  if (contentType.includes("text/event-stream")) {
    const messages: JsonRpcResponse[] = [];
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        messages.push(JSON.parse(payload));
      } catch {
        /* skip non-JSON data lines */
      }
    }
    const match = messages.find((m) => m.id === id) ?? messages.find((m) => m.result || m.error);
    if (!match) throw new T3Error("No JSON-RPC message in T3 stream.", "protocol");
    return match;
  }
  try {
    return JSON.parse(text) as JsonRpcResponse;
  } catch {
    throw new T3Error("T3 returned a non-JSON response.", "protocol");
  }
}

/** One open MCP session against the T3 environment, usable for several tool calls. */
export class T3Session {
  private id = 0;
  private sessionId: string | null = null;

  private constructor(private readonly cfg: T3Config) {}

  private async post(payload: object, expectReply: boolean): Promise<JsonRpcResponse | null> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${this.cfg.token}`,
      "mcp-protocol-version": PROTOCOL_VERSION,
    };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;

    let res: Response;
    try {
      res = await fetch(this.cfg.mcpUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        // Keep a tight ceiling: a serverless function should not hang on a sleeping host.
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      throw new T3Error(`Could not reach T3 at ${this.cfg.baseUrl}: ${(err as Error).message}`, "unreachable");
    }

    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;

    if (res.status === 401 || res.status === 403) {
      throw new T3Error("T3 rejected the token (sign-in expired or wrong scope).", "auth");
    }
    if (!expectReply) return null; // notifications: 202 with no body
    if (!res.ok) throw new T3Error(`T3 HTTP ${res.status}.`, "unreachable");

    const body = await res.text();
    const parsed = parseBody(body, res.headers.get("content-type") || "", (payload as { id: number }).id);
    if (parsed.error) throw new T3Error(`T3: ${parsed.error.message}`, "tool");
    return parsed;
  }

  private nextId() {
    this.id += 1;
    return this.id;
  }

  static async open(cfg: T3Config): Promise<T3Session> {
    const s = new T3Session(cfg);
    const initId = s.nextId();
    await s.post(
      {
        jsonrpc: "2.0",
        id: initId,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "bdn-command-center", version: "1.0.0" },
        },
      },
      true,
    );
    // Required by the MCP lifecycle before any tool call.
    await s.post({ jsonrpc: "2.0", method: "notifications/initialized" }, false);
    return s;
  }

  /** Call one MCP tool and return its parsed result object. */
  async callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const reply = await this.post(
      { jsonrpc: "2.0", id: this.nextId(), method: "tools/call", params: { name, arguments: args } },
      true,
    );
    const result = reply?.result as { content?: Array<{ type: string; text?: string }>; structuredContent?: unknown; isError?: boolean } | undefined;
    if (!result) throw new T3Error(`T3 tool ${name} returned nothing.`, "protocol");
    if (result.isError) {
      const msg = result.content?.map((c) => c.text).filter(Boolean).join(" ") || "tool error";
      throw new T3Error(`T3 tool ${name}: ${msg}`, "tool");
    }
    if (result.structuredContent !== undefined) return result.structuredContent as T;
    const textItem = result.content?.find((c) => c.type === "text" && c.text);
    if (textItem?.text) {
      try {
        return JSON.parse(textItem.text) as T;
      } catch {
        return textItem.text as unknown as T;
      }
    }
    return {} as T;
  }

  async close(): Promise<void> {
    if (!this.sessionId) return;
    try {
      await fetch(this.cfg.mcpUrl, {
        method: "DELETE",
        headers: { authorization: `Bearer ${this.cfg.token}`, "mcp-session-id": this.sessionId, "mcp-protocol-version": PROTOCOL_VERSION },
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      /* best effort */
    }
  }
}

// ---- Shapes we rely on from the T3 MCP contract (packages/contracts/src/orchestratorMcp.ts) ----

export type T3ProviderCapability = {
  providerInstanceId: string;
  driverKind: string;
  displayName: string | null;
  models: Array<{ id: string; label?: string }>;
};
export type T3Capabilities = { providers: T3ProviderCapability[] };

export type T3ThreadSummary = {
  threadId: string;
  projectId: string;
  title: string;
  link?: string;
  status: string;
  providerInstanceId: string;
  model: string;
};
export type T3ThreadList = { projectId: string | null; threads: T3ThreadSummary[]; nextCursor?: number };

export type T3ThreadReadResult = {
  threadId: string;
  title: string;
  link?: string;
  status: string;
  messages?: Array<unknown>;
  items?: Array<unknown>;
  [k: string]: unknown;
};

// ---- High-level helpers ----

export async function getCapabilities(s: T3Session): Promise<T3Capabilities> {
  return s.callTool<T3Capabilities>("orchestrator_capabilities", {});
}

/** Resolve a provider match (array of lowercase substrings) to one running instance + a model id. */
export function resolveProvider(
  caps: T3Capabilities,
  matchers: string[],
): { providerInstanceId: string; model: string; displayName: string } | null {
  const want = matchers.map((m) => m.toLowerCase());
  for (const p of caps.providers) {
    const hay = `${p.displayName ?? ""} ${p.driverKind}`.toLowerCase();
    if (want.some((w) => hay.includes(w))) {
      const model = p.models[0]?.id;
      if (!model) return null;
      return { providerInstanceId: p.providerInstanceId, model, displayName: p.displayName ?? p.driverKind };
    }
  }
  return null;
}

export async function listAllThreads(s: T3Session): Promise<T3ThreadSummary[]> {
  const out: T3ThreadSummary[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 10; page += 1) {
    const args: Record<string, unknown> = { allProjects: true };
    if (cursor !== undefined) args.cursor = cursor;
    const res = await s.callTool<T3ThreadList>("t3_thread_list", args);
    out.push(...(res.threads ?? []));
    if (res.nextCursor === undefined || res.nextCursor === null) break;
    cursor = res.nextCursor;
  }
  return out;
}

export async function readThread(s: T3Session, threadId: string): Promise<T3ThreadReadResult> {
  return s.callTool<T3ThreadReadResult>("t3_thread_read", { threadId, view: "messages", afterPosition: -1 });
}

export async function sendToThread(s: T3Session, threadId: string, message: string) {
  return s.callTool("t3_thread_send", { threadId, message, mode: "auto" });
}

export async function launchThread(
  s: T3Session,
  opts: { title: string; message: string; providerInstanceId: string; model: string },
) {
  return s.callTool<{ threadId: string; link?: string; status: string }>("t3_thread_launch", {
    title: opts.title,
    message: opts.message,
    scratch: true,
    modelSelection: { instanceId: opts.providerInstanceId, model: opts.model },
    clientRequestId: `bdn-cc-${Date.now()}`,
  });
}
