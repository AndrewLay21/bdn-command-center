# Dashboard Chat — ChatGPT handoff and optional API replies

Added October 28, 2026 at Coach Drew's request. Access from the sidebar or “Talk to dashboard” button. Typed messages and browser voice dictation share an editable composer. Dictation starts only on a click, stops on navigation/backgrounding or after a minute, and never sends automatically. Listen reads a saved reply only on click. The browser's speech service may process audio online; unsupported or denied microphone access retains typed input and offers a full-page link.

The server is prepared for authenticated, read-only OpenAI Responses API answers. It reads the current portfolio, original tasks, dated audit and weekly plan using the same signed-in request identity. All record IDs/statuses are indexed; detailed context is limited to 20 relevant/recent records. Missing sources are explicit. Responses cite allowlisted record IDs that open existing editors. No tool invocation or business mutation exists in chat.

The last 20 exchanges per dashboard role are stored in the existing D1 database under `chat:v1:<authenticated visitor ID>`. Each send uses an optimistic revision and unique request ID; duplicate and in-flight retries do not issue another model call. Save/readback must match before returning an answered turn. Provider failures are stored as errors, never fabricated replies. At most 40 request attempts per visitor per America/New_York day. Older chat exchanges roll off; original business evidence is untouched. Conversation history is read from the server, not accepted as client-authored assistant messages.

## Remaining secure setup

No production AI environment variables existed at inspection. No provider call or billing action was performed. Chat replies stay disabled until all three runtime entries are set through Sites: secret `OPENAI_API_KEY`, approved `OPENAI_MODEL`, and `DASHBOARD_CHAT_ENABLED=true`. Before obtaining/configuring a key use the OpenAI Developers plugin's `openai-platform-api-key` skill and its approval requirements. Do not paste credentials into chat, source or browser storage. Confirm the account, model and usage budget before activation; deploy the current saved version with the environment revision. Do not change the Site audience.

Then test a signed-in question and its exact saved reply/readback. Check that server-side source isolation and no-write behavior hold. Verify a real microphone grant, transcript and Listen on the user's browser; in-app embedding may restrict the microphone. Current automated checks use mocked provider/speech engines and do not establish live AI or microphone operation. Managed preview remains unavailable; signed-in visual QA remains separate.

References: https://developers.openai.com/api/docs/guides/text and https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition .

## Agent selector — October 28, 2026

Coach approved key creation and the ignored `.env.local` destination. Provisioning is blocked: the OpenAI Developers creation connector is exposed, but its required `openai-platform-api-key.mjs` local helper is absent from the environment and unavailable through the skill resource reader. No key was created or secret written. No additional owner approval is needed to resume the already-approved local setup; do not ask for a key in chat. Runtime AI remains disabled.

A dropdown switches between Dex the Best (systems and verification), Drew 2.0 (priorities and production), and Mansa Musa (creative and evidence). These are explicitly labeled dashboard roles, powered by the same eventual AI connection. They are not integrations with the separate agents or their conversations. No external agent has been contacted or activated.

Each role has its own suggestions, portrait, conversation history and in-page draft. All three views remain mounted; switching stops microphone/read-aloud activity and does not discard an unsent draft or misroute an in-flight response. Reloading loses unsent drafts. Existing untagged exchanges belong to Dex. The server validates the role, isolates prompt history, bounds retention to 20 turns per role, and keeps the existing per-visitor daily 40-attempt quota and optimistic revision shared across roles. User isolation, request deduplication, source evidence and all no-write restrictions remain intact.

## Secure activation update — October 28, 2026, 5:20 PM ET

The missing official helper was recovered unmodified from OpenAI's `openai/plugins` repository (`plugins/openai-developers/scripts/openai-platform-api-key.mjs`, blob e05bea1087f2c8afd711520f86a925154b0d2e94). The previously approved key was created as **Coach Drew Command Center** in **Big Dreams Network / Default project**, written to ignored `.env.local` with mode 0600, and securely configured as the hosted `OPENAI_API_KEY` secret. No key value was printed or committed.

A single real Responses API check using `gpt-6-luna`, `reasoning.effort=none`, and a fixed READY prompt reached OpenAI but returned HTTP 429, code `credit_balance_exhausted`, type `insufficient_quota`. No successful AI reply is claimed. The remaining blocker is the API organization's prepaid balance, not a missing helper or key. No credits were purchased, payment details entered, or billing settings changed. Do not retry the billing error until the balance is addressed.

Runtime model is GPT-6 Luna; the 40-attempt daily chat limit remains shared across roles. Sending is enabled once the activation environment revision is deployed; provider credit errors now explain the issue and offer the official API billing link. After funding, Coach can send a question without another deployment. A successful real dashboard reply/save/readback and real browser microphone test remain unverified. Owner screenshots show the selector and input working, and microphone access denied/unavailable inside the embedded panel; use the full-page link to review microphone permission.

Sources: https://developers.openai.com/api/docs/models/gpt-6-luna ; https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing . Earlier setup notes above are preserved as history; this update supersedes their current-state claims.


## ChatGPT handoff — October 28, 2026

Coach cannot fund API credits right now. Dashboard Chat now starts in **Use in ChatGPT / No API credits needed** mode. Pick Dex, Drew or Mansa as a focus, type or dictate, and prepare the question. The authenticated same-origin `/api/dashboard-chat/handoff` endpoint reads saved sources without calling a model, accessing a provider key, changing tasks, or recording an artificial chat exchange. It does not consume the API chat quota. It returns a dated export with missing-source flags, up to 10 relevant/recent detailed records, up to 60 index entries, bounded text fields, founder decisions, audit summary and the saved weekly plan (size limited). Linked sources are not independently fetched.

Coach reviews the prepared text, clicks **Copy question & context**, then pastes and sends it in an existing ChatGPT conversation. A plain **Open ChatGPT** link contains no query or private data. Clipboard denial selects the visible text for manual copying. A changed question invalidates its old handoff; each role keeps a separate draft and handoff while the page stays open. Nothing is sent to ChatGPT automatically, no other agent is contacted, and ChatGPT answers do not automatically sync into dashboard history. ChatGPT's existing usage limits apply.

**Reply in dashboard / Uses API credits** remains an explicit alternate mode, with the existing key and saved history preserved. No live provider call, payment or billing change was made for this workaround. The default handoff mode does not load or poll the API conversation. Authenticated browser/clipboard and real microphone verification remain separate from automated endpoint and frontend checks.
