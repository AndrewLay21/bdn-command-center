# Dashboard connection repair — October 24, 2026

Scope: repair the existing owner-private Executive Command Center, project appgprj_6ace4a47b23881918a00ef6e8aff6542. Preserve layout, task IDs, source records, founder decisions, owner overrides, D1 data and history. No schema migration, data reset or external-agent dispatch.

## Changes

- Added stateless Site MCP at POST /mcp and declared `mcp` capability. Three tools only: get_coach_core_status, update_coach_core_status, check_dashboard_connection.
- The evidence writer delegates to the existing revision-checked Coach Core sync handler and its existing project/task/decision schema. It never reads or writes owner-private overrides. Existing source/acceptance requirements still apply.
- Added /api/connection-health: a durable probe/readback in the existing dashboards table, under system:dashboard-connection:v1. Reusing the same probe ID is idempotent. Operational checks never update evidence timestamps or tasks.
- Existing Sites dispatch provides owner-private access. Audience expansion requires a fresh authorization review before shared service writes can continue. No access policy changes.
- UI distinguishes loaded records, last saved GitHub source check, and last connection write/readback. Source evidence older than two hours is visibly stale. A check never claims a scheduled run or an external Claude/Muse session is active.
- Removed misleading "live" wording for page reloads. Historical checkpoints remain historical; the next assessment is uncommitted, pending a current founder-reviewed plan.
- Queue regression now derives the expected open count from current saved seed/plan records instead of assuming all original 47 remain open. All original 47 record IDs and the lease/revision/independent-review/owner-edit protections remain asserted.

## Verification

- verify-dashboard-connection.cjs: 16/16 isolated route checks, including durable readback, failed readback, idempotency, conflicting revisions, unknown tool, cross-origin rejection, invalid payloads, founder/cross-project rejection and byte-identical owner/queue records.
- verify-task-sync.cjs: PASS; evidence projects to board/history, decision/project restrictions, revision conflicts and newer owner edits preserved.
- verify-execution-queue.cjs: 20 lifecycle/security checks PASS.
- TypeScript: zero errors.
- Production build: PASS with existing proxy environment notice.
- Managed preview daemon reports its URL but both browser and loopback requests receive connection refused; no local browser/visual pass claimed. Hosted transport/persistence checks must be performed after publication.

## Unattended updater

Reuse the paused existing Coach Core status sync; do not create a duplicate. Confirm current owner-only audience through Sites get_site on every run. Obtain current supported service access in memory only and send it solely to this Site. Verify connection probe, read current evidence revision/instructions, read current GitHub sources, write source-backed changes, and read back the saved revision/snapshot. Preserve all existing projections and history. One conflict reread/reconcile is allowed. Failure means report the actual blocker, not mark progress.

The updater is evidence reporting only. Keep the portfolio execution dispatcher paused: this repair does not connect external Claude Desktop/Muse workers, authorize new code work, or approve spending, merge, app deployment or publishing.

## Rollback

Prior source: 4e05d540875a1ffdbd79eebe9c229387005a829b, dashboard version 34. Re-publish that saved version if necessary. No task data rollback is required: the new connection metadata uses a separate system key. Never reset the D1 database or restore old task payloads over owner edits.
