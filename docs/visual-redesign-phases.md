# Command Center visual redesign

Founder direction, October 28, 2026: improve the existing interface in reviewable phases. Preserve stored records, save flows and existing functionality.

## Phase 1 — home and agent workspaces

Implemented: a calmer green/cream/gold home; three original illustrated AI portraits; Drew 2.0, Mansa Musa and Dex the Best (Codex) cards with current focus, saved task windows and evidence-qualified completion windows; decision desk; next milestone; recent results; schedule shortcut. Broader priority cards remain in an expandable section. Existing navigation, record edits and history remain available.

Data comes from the existing authenticated portfolio and original-task endpoints. Original tasks deep-link into the existing record editor. No new task records, agents, transmissions, schedules or background workers are created. Refresh means read saved records. The two October 28 founder directions and approvals are dated snapshots linking to their authoritative sheets, not a live sheet integration. A future live handoff feed is separate work.

October 28 addition: Coach Drew named Codex “Dex the Best.” The third workspace reads existing Codex-owned tasks and accepts Dex / Dex the Best as display aliases without rewriting saved owners or duplicating records.

Do not infer current execution, agent availability or receipt of a direction from ownership. Do not map the historical Roman/Muse owner to Mansa without confirmation. Approved and reported-complete items are distinct from completion with evidence. Date-only imported records retain their calendar date; timestamped updates use America/New_York.

## Phase 2 — Next Steps

Founder authorized continuation on October 28. Implemented the Next Steps visual refresh with status summaries, search, business area / owner / priority / status filters, sorting, removable filter chips and clearer task cards. Each card shows its existing status, next action, finish line, saved owner and evidence/source date; it opens the existing editor. Review labels do not imply a new approval request. Owner aliases are presentation-only, and unknown ownership stays visible. No portfolio records or completion states are changed by filtering or viewing.

## Phase 3 — record editors and founder decisions

Founder authorized continuation on October 28. Both record editors now put evidence before the decision and next action, retain the original source/history, show unsaved changes, protect an edited draft on close/navigation, and provide copy-draft recovery. Unchanged saved approvals do not show an acceptance prompt or permit redundant saves. Existing acceptance requirements remain enforced when an accepted record is edited.

A shared controller captures the opening revision, prevents duplicate writes, verifies exact editable fields through a fresh GET before showing success, and retains the draft if readback fails. Retrying an uncertain save checks the record only; it does not issue another write. Rejected/conflicting requests retain the draft. Target dates now support dates beyond October and derive their offset using America/New_York; changing a target resets its deadline confirmation.

The founder-decision screen separates open decisions from recorded directions. Earlier scope notes remain accessible. The home decision desk links directly to it. No business approvals, task statuses, agent acknowledgments or execution states were changed by this UI release.

## Next phase

October 28 founder-requested addition: Dashboard Chat UI, typed messages, browser dictation and optional read-aloud, plus a private read-only AI backend with current-record context, source links, bounded history and duplicate-request protection. Production has no configured AI connection; Send stays disabled pending secure OpenAI setup and live verification. See `docs/dashboard-chat.md`. This is not an agent-dispatch integration.

October 28 screenshot correction: Daily Audits now wraps long filenames and uses the available panel width to stack cards in an embedded or narrow view. Every audit card carries its evidence cutoff. Dated audit summaries are labeled as saved history. The action lists compare explicit IDs with the signed-in portfolio and mark evidence-backed Done records, preserving the original instruction in a disclosure. Unresolved, unknown and unverified references remain visible. No audit snapshots, task statuses, schedules or source history are rewritten.

4. Weekly schedule, capacity, remaining screens and final mobile polish.

Review the record editors and founder-decision screen before the final schedule and remaining-screen polish. This sequence does not authorize automatic production edits for all later phases.

## Verification

Phase 2 validation: next-step filters, aliases, sorting, immutable records and rendered cards; portfolio authorization/save/readback regression checks; TypeScript; normal Sites build. Earlier team/audit/TradeLab checks remain in the repository. Phase 3 adds controller tests for draft protection, acceptance gates, exact readback, failed checks, GET-only retry, duplicate clicks, and New York DST dates, plus existing portfolio and task-sync regressions. Managed browser preview is currently unavailable because another Vinext server owns the environment preview port. Do not alter an unrelated server or application auth to compensate; record the browser QA limit in the handoff.
