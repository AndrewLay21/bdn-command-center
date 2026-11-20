# T3 Code integration — NOTES

Branch: `t3-integration` (off `netlify-command-center` @ `dfa07f0`). **Not merged. Not on production.**
Goal: from each connected agent's Command Center page, list that agent's T3 Code
threads and send it a message, then see the reply — without ever exposing the
T3 address or token to the browser.

## How it works (plain version)

- T3 Code has **no plain REST API**. An outside program reaches a running T3
  environment through its built-in **MCP server** (HTTP + JSON-RPC) at
  `<environment-address>/mcp`, using a **bearer session token**.
  (Source: T3 Code docs `user/outside-agents.md`, `internals/environment-auth.md`.)
- So the browser never talks to T3. The page calls our own server routes under
  `/api/t3/*`; those routes run on Netlify (as Next.js route handlers), open an
  MCP session to T3, call T3 tools, and return only the data the page needs.
- The T3 address and token live **only** in Netlify environment variables,
  read on the server in `lib/t3.ts`. They are never in code, git, logs, or the page.

## Pieces added

| File | What it does |
|---|---|
| `lib/t3.ts` | The T3 MCP client (open session, call tools) + helpers. Reads `T3_BASE_URL` / `T3_TOKEN`. |
| `t3-agents.json` | Maps each agent to its T3 provider. Unlisted agents = **not connected**. |
| `lib/t3-agents.ts` | Loads that mapping. |
| `lib/api-auth.ts` | `ownerGuard()` — the password lock for the API routes. |
| `app/api/t3/agents/route.ts` | Which agents are connected + whether T3 is configured. |
| `app/api/t3/threads/route.ts` | `GET ?agent=<id>` → that agent's T3 threads. |
| `app/api/t3/thread/[id]/route.ts` | `GET` → one thread's messages. |
| `app/api/t3/send/route.ts` | `POST {agentId,message,threadId?}` → send, or start a new thread. |
| `components/agent-messaging.tsx` | The live message box on a connected agent's page (falls back to the draft box when T3 is offline). |
| `app/(app)/avengers/[id]/page.tsx` | Connected agent → live box; everyone else → unchanged draft box. |

The old draft-only box (`components/draft-box.tsx`) is untouched and still used
for every not-connected agent and as the offline fallback.

## Environment variables (names only — never commit the values)

Set these in **Netlify → Site settings → Environment variables** (scope them to
the branch deploy / deploy previews as you prefer):

- `T3_BASE_URL` — your T3 environment address (the T3 Connect public URL). With
  or without a trailing `/mcp`; the code adds `/mcp` if missing.
- `T3_TOKEN` — a T3 **bearer session token** (see below).

If either is missing, every `/api/t3/*` route reports `offline` and the pages
quietly fall back to draft-only. Nothing breaks.

Already present (do not change): `COMMAND_CENTER_PASSWORD` (and optional
`SESSION_SECRET`) — the owner password that also guards these new routes.

## One-time setup on Oasis (the PC that runs T3)

1. Turn on T3 Connect so T3 has a public HTTPS address:
   ```
   t3 up --connect
   ```
   Note the environment address it shows (that is `T3_BASE_URL`).
2. Mint a bearer token scoped to orchestration only (least privilege):
   ```
   t3 auth session issue --scope orchestration:read --scope orchestration:operate
   ```
   Copy the printed bearer token → that is `T3_TOKEN`. Paste both values into
   Netlify's environment variables. **Do not paste the token into chat or git.**
3. Make sure the providers you want are on in T3 (Settings → Providers). The
   mapping in `t3-agents.json` matches an agent to a provider by its display
   name, so the provider must be running for that agent to connect.

Token note: T3 sign-ins last ~30 days and renew while used; if messaging starts
returning "sign-in expired", re-run step 2 and update `T3_TOKEN`.

## The agent → provider map (`t3-agents.json`)

Connected now (based on the providers you said are on):

| Agent | T3 provider |
|---|---|
| Zeus | Grok Zeus |
| Dex the Best | Codex |
| Mansa Musa | Mansa Muse |
| Levels | Antigravity |
| Forge | Claude |

- **Grok Titan** is on in T3 but not matched to an agent yet. To connect one of
  the Grok Bot team (Thoth, Horus, Imhotep, Care, Ref, Safety), add a block like
  `"thoth": { "provider": ["grok titan"], "status": "connected" }`.
- The single **Claude** provider is assigned to Forge. Move that block to Sage,
  Vision, or Lens if you'd rather.
- Every other agent is **not connected** and keeps the draft-only box.

Editing `t3-agents.json` is all it takes to connect, move, or disconnect an
agent — no code change.

## Turn it off

- **Fastest:** remove `T3_BASE_URL` and `T3_TOKEN` in Netlify and redeploy. All
  agents fall back to draft-only; nothing errors.
- **Per agent:** set that agent's `status` to `"not_connected"` (or delete its
  block) in `t3-agents.json`.
- **Kill the token from T3's side:** on Oasis, `t3 auth session list` then
  `t3 auth session revoke <id>` — the routes immediately get 401 and fall back.

## Security

- Secrets are read only in server modules (`lib/t3.ts`, marked `server-only`)
  and never returned to the browser.
- Every `/api/t3/*` route calls `ownerGuard()` first, so a caller without the
  owner session cookie gets `401` — the same password lock as the pages.
- The MCP token is scoped to `orchestration:*` only, not terminal/shell access.

## Status vs. the success checks

Done in code (verified by typecheck/build):
- Routes + client, password gate on every route, offline fallback, no secrets in repo.

Pending live verification by Drew (needs T3 paired on Oasis + the two Netlify
env vars + a deploy preview):
- [ ] Zeus page lists Grok Zeus threads from T3.
- [ ] A test message appears in T3 and its reply shows on the page.

Use a test thread for the live check, never real work.
