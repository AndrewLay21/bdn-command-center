# Portfolio execution pilot — October 16, 2026

Scope: existing owner-private command center only. All 47 original unfinished task IDs mapped without changing parent statuses, accountable owners, decisions, content approvals, access or application release gates. Coach Core stays MVP NO-GO. The original inventory v1.0 is still not identified; this is the current dashboard inventory, not a complete undiscovered business inventory.

## Execution contract

GET /api/execution-queue returns versioned instructions, current revision, 47 mapped records, three bounded draft/review jobs, reports, evidence and activity. POST supports claim, deliver, claim-review, verify and block with revision CAS; owner sign-in also supports pause/resume. One builder and one reviewer maximum. A 90-minute expired lease requires triage; no automatic retry or duplicate work. A checkpoint may be attempted once in this pilot.

Service access relies on the confirmed Sites owner-private dispatch boundary, same as the existing evidence feed. Obtain service credentials afresh in memory through Sites get_site; never store or print them. Stop writes if audience expands. No new public access or external editor.

Any owner-private task override row stops execution pending scoped reconciliation. The service neither reads nor exposes private override contents. Execution writes also use an atomic NOT EXISTS owner-row predicate, closing the race between the preflight and the queue mutation. A runner rechecks before work. Pause/resume remains available to the signed-in owner. This conservative first-pilot behavior is deliberately visible rather than silently ignoring future owner edits.

Reviewer actor/run IDs must differ from the builder. They are workflow checks, not an authentication or cryptographic independence boundary; actual independent source review must use a separate agent/run. A handoff comment does not wake Claude Desktop or Muse. Those runners are unconnected and their work remains reserved, not executed by an invented agent.

## Three bounded jobs

1. BDN-SPONSOR-01: exact-source sponsor decision packet, separately reviewed. No offer or funnel edits.
2. PORTFOLIO-SEQUENCE-01: independent current-queue dependency and next-three-action review. Preserve records and proposed-versus-confirmed ownership/deadlines. No original task closures.
3. BDN-REVIEW-01: source/evidence consistency review of PR39. No new runtime/browser/device testing claimed.

Jobs 2 and 3 require job1 verified. Original47 record sequence is topologically sorted over explicit recognized open-record references; text-only, missing, external and human gates remain unresolved. It is a proposed triage sequence, not proof all47 are executable or fully dependency-validated.

## Validation and limitations

19 focused queue route checks cover lifecycle, revision conflicts, dependencies, capacity, evidence URLs, self-review rejection, expired leases, atomic owner-change stop and preservation of parent counts. Existing task-sync checks remain passing. TypeScript and production build are required before publishing. Separate source reviewer identified the owner-hold race and phase-expiry UI defect; both corrected. Browser visual QA unavailable in the current supported Sites environment; no replacement browser installed.

The sponsor packet lives at /sponsor-decision-packet.md. Separate reviewer independently fetched the four historical exact-source files through GitHub. The packet labels external-intake observations historical, quantity inclusion ambiguous, and all offer terms unapproved. Its acceptance does not close website release tasks.

## Scheduled operating loop

Use one hourly portfolio dispatcher alongside the existing Coach Core evidence reader; do not duplicate or alter the reader. Each run reads current queue instructions, claims work before execution, uses connected GitHub sources, delivers a source-linked report, and gets a separate review before verification. It performs no app-code change, external messaging, spending, deployment, provider change, price approval or source-task status mutation. When jobs exhaust, it reports the consolidated founder/access requirements instead of inventing more authorized work. This is a limited executable pilot, not a claim that all47 will complete automatically.

## Founder-authorized continuation — 13:39 ET October 16

Coach Drew approved the next assignments and recommendations ("yes i approve all"). Exact shared record: https://github.com/DigitalBlueprint239/coach-core-ai/issues/39#issuecomment-6221265245 ; readiness pointer: https://github.com/DigitalBlueprint239/coach-core-ai/issues/52#issuecomment-6221268237 .

- CC-A4B: manual re-save accepted for disclosed private beta within tested editor retention/manual re-save scope on518e9e5. Device draft presence was recorded, not asserted; all untested scenarios remain explicit. No new automatic-retry feature, broad durability acceptance or release approval.
- CC-B11: Claude prepares isolated CI split for review, preserving every assertion/test/repeat/project, zero retries, release proof and raw artifacts. No timeout increase or reduced test coverage. Posting a handoff does not establish acknowledgement or execution.
- BDN-DEPENDENCY-PLAN-01: primary-source supported migration plan only. No installation/code/lockfile changes or waiver.
- BDN-ARTIFACT-01: exact retained bytes/hash reconciliation; no rebuild, invented hash or performance claim. An unavailable original artifact must remain an unresolved limitation with a recovery method.
- CC-INTEGRATION-PLAN-01: bounded dependency-aware plan only; inspect inherited history and CI/deploy triggers before any integration. No direct PR72 merge, branch retirement or deployment.

The original three verified checkpoints and all47 parent records remain intact. Queue instruction version2 adds the three bounded planning/evidence jobs. Read-time additive defaults allow old persisted queue states to see new jobs without resetting prior status, reports, history, revisions or leases. Twenty focused lifecycle/security/migration checks plus existing task-sync route checks pass. Separate review remains required; a later distinct scheduled invocation may review fresh source. Original pilot language above is historical and superseded only for the added explicit scopes.

Owner-only access and approval boundaries remain. Founder read-only checks G2–G4, physical devices, rights, missing import policy/config choices and actual runner acknowledgements remain open. MVP NO-GO; AI off.
