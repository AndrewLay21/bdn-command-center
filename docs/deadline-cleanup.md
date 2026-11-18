# Deadline-only cleanup

## Problem and scope

The November 11 cleanup left 23 Approved/Verified complete legacy records with old unconfirmed deadlines. Those records lack the optional stored `accepted` field. The general save tool requires a Boolean, and its completion gate rejects false. Setting true would mutate acceptance and is not authorized by administrative cleanup. Keep the original completion gate unchanged.

`clear_obsolete_deadline` accepts only task ID, current revision and exclusive claim. It clears only an expired, unconfirmed deadline. A separate stored marker applies only while the source deadline still matches; a different date or confirmation wins. It preserves raw overrides, acceptance (including absence), task timestamps, status, evidence, owners, holds and prior history. Its history receipt retains the old date. No data migration, task completion, new acceptance, schedule or dispatch is performed by publishing the code.

## Existing-agent improvement loop

1. Read current task, authority and claim; check whether cleanup is already complete.
2. Inspect required fields before writing. Do not synthesize acceptance, downgrade status or repeat an unchanged failed request.
3. Acquire the existing task claim. Use the dedicated cleanup tool with the fresh revision.
4. Read back: only deadline/deadlineConfirmed may differ in the task. Check retained history and unchanged acceptance/status/evidence/owners/holds.
5. Explicitly release the claim. On a conflict or unknown result, reread before another attempt.
6. Validate one eligible record first; continue the remaining authorized records only after it passes. Record exceptions once and fix their cause.

Dex owns technical repair/testing; Drew 2.0 coordinates the cleanup receipt; Mansa continues approved publishing against existing handoffs. A saved assignment is not acknowledgment or evidence of execution. Keep existing schedules and release gates.

## Validation

- `node scripts/verify-deadline-cleanup.cjs`: 23 legacy scenarios, exact-field/override preservation, retained history, missing/false/true acceptance values, future/confirmed dates, stale revisions, wrong claims, injected approval/status, repeat writes and unchanged completion gate.
- `node scripts/verify-execution-transport.cjs`: existing authenticated transport regression checks.
- `node node_modules/typescript/bin/tsc --noEmit`
- Sites production build.

## Release and recovery

Production deployment requires applicable release authorization. After release, use the supported authenticated operation, not database edits or acceptance toggles. Stop on unexpected field differences. Code rollback alone restores the prior reader, which ignores cleanup markers; no acceptance or original override restoration is necessary because this operation never rewrites them. Keep all history and markers for audit.

Older connector compatibility: a full `save_task_update` request is routed to the same cleanup handler only when the record lacks `accepted`, the caller supplies false (not a new approval), deadline is empty/unconfirmed, all status/notes/evidence fields match exactly, and no extra fields exist. It never persists that Boolean. Any changed substantive field follows the original acceptance gate. This avoids requiring a connector refresh to finish the authorized cleanup.
