# Big Dreams Network — validated repair batch, October 16, 2026

Status: REVIEWABLE BRANCH REPAIRS. Website production remains unchanged. This is not independent release acceptance.

## Exact source and deployed state

- Original PR39 candidate: `01e54ea05a38f8d867aec1e842fc8f033459c5ed`.
- Tested repair source: `867348bc5304cda5f67cd62e68f3927f57d06077` on `codex/bdn-website-baseline-2026-10-16`.
- All 356 original tracked files reconstructed and checked against Git blob hashes; zero omissions/mismatches. Locked install completed. Final seven changed source/config/lock/test blobs were independently read back from GitHub and match local validation hashes.
- Netlify read-only metadata now establishes live production: deploy `6ac68b72120c510008a0b7a2`, main revision `8857733b0a5a22b63f90ff802866a3b0cc69d5cc`, ready at bigdreamsnetwork.com. This supersedes the earlier baseline's unknown-production-SHA limitation.
- PR38 and main remain unchanged. PR39 is stacked on PR38 and remains draft.

## Repairs and evidence

| Finding | Change | Evidence and limits |
|---|---|---|
| Malformed anchor fragments throw `URIError` from the scheduled scroll callback | Catch invalid percent decoding and ignore the invalid target | Three before-fix regressions fail; all five focused hash tests pass after repair. This establishes an uncaught scrolling error, not a demonstrated full-page crash. |
| One privacy CLI test and the build launcher fail before reaching the script when Unix IPC binding is denied | Use the supported Node `--import tsx` loader; resolve its exported entry with Node createRequire when the test changes working directory | Same real CLI script, malformed YAML/evidence assertions, sentinel assertions, exit code and stale-output checks retained. No skips, retries, assertion weakening or permission escalation. |
| Build-tool typecheck lacked JSX and DOM types despite importing static React views | Add react-jsx and DOM libraries to tsconfig.node.json | Node/build config now checks along with the app, editorial, media and newsroom projects. No emitted runtime code from this configuration. |
| Locked dependency graph contains compatible fixes | Apply npm audit fix to the lockfile without force or changing direct dependency ranges, then clean install | Audit findings 20 →15. No forced/major direct upgrades. Typography/Tailwind and related tooling received compatible updates; sample hosted desktop QA completed in the follow-up; device coverage remains open. |

Baseline preserved: 288/289 tests passed; one launcher/socket failure. First root build failed at the same tsx CLI before editorial build execution. The initial JSX fix exposed missing DOM types; the first attempt at public import.meta.resolve worked in native Node but failed under the existing Vite test transform. Final test resolution uses Node createRequire instead. Failed baseline and intermediate full-test logs are preserved; no claim those failures were product regressions.

## Final validation on repaired source

| Check | Result |
|---|---|
| Full suite | **292 passed /0 failed**,22 files |
| Malformed-link regression | Before:2 pass/3 fail; after:5 pass/0 fail |
| Production build | **PASS** |
| App, Node/build, editorial, media, newsroom typechecks | **PASS**, all five |
| Lint | **0 errors /20 warnings**; existing warnings retained |
| Media public-boundary canary | **PASS**, actual production build and artifact scan |
| Newsroom public-boundary canary | **PASS**, actual production build and artifact scan |
| Dependency audit | **15 affected-package findings:2 critical,6 high,7 moderate**; command exit1 intentionally retained |

This is implementation-owner validation, not independent reviewer acceptance. Hosted desktop UI was subsequently sampled on the exact candidate; see [hosted acceptance follow-up](/bdn-hosted-acceptance-2026-10-16.md). Physical devices and actual Spotify/YouTube media progress remain unverified. No substitute local browser was started. Tests use synthetic content and do not grant content/voice/athlete rights or release approval.

## Remaining dependency exposure

The previous register's21-entry historical figure is superseded for this candidate by the fresh before/after audit files. Findings count affected package entries, not unique advisories or demonstrated exploits. The two critical entries remain Vitest and its Tinypool test dependency. Their documented exploit conditions were source-traced in the hosted follow-up; no waiver was granted; no public production exploit was reproduced. Do not expose a test UI/API or accept untrusted worker configuration.

React Router remains a browser-runtime advisory entry. SSR hydration deserialization is not used by this static application; repository-owned navigation was sampled against the backslash/open-redirect advisory; independent review and remediation remain open. Some CSS/build packages are installed through the production dependency graph; that flag alone does not establish browser execution. No risk waiver is recorded.

Remaining larger migrations require a separate reviewed candidate: Vite, Vitest/Tinypool, Router and CSS toolchain. Do not override incompatible transitive major versions or run audit fix --force merely to reduce a counter.

## Performance baseline and next work

The finalized local JS artifact is1,101,641 bytes; CSS96,760 bytes. This batch does not claim a loading-speed improvement. The large eagerly loaded route bundle remains a measured optimization target. Browser timing, Lighthouse, real-user conversion and accessibility scores: NOT MEASURED. Build durations vary with warm caches and concurrent checks; no speedup percentage is inferred.

Next reviewable task: independently replay the exact repaired source and privacy assertions, inspect the seven changed files and audit exposure, then test real route/player/mobile behavior in an approved preview. Route splitting should be isolated and include loading/error recovery plus hash/deep-link behavior; do not add it to this already validated repair batch.

Generated sitemap date changes from local builds were reverted from source. No branding, feature flags, real content, production form submissions, credentials, permissions, Supabase or Queens changes. No merge, production deploy, purchase or public content release. Coach Core remains a separate project.

Rollback: review/revert this repair commit on the isolated branch and repeat its tests. The malformed-anchor error and restricted-launcher failure would return; do not treat a revert as release approval.

Evidence directory: `docs/ai-engineering/evidence/2026-10-16/`. Source hashes and exact audit counts are in validation-summary.json; raw failed and passed runs remain alongside it.

References: official Node loader usage https://tsx.is/dev-api/node-cli and https://github.com/privatenumber/tsx/blob/master/docs/dev-api/node-cli.md; advisories https://github.com/advisories/GHSA-85c8-ppgw-ccpr, https://github.com/advisories/GHSA-82fw-gwwq-j7x9, https://github.com/advisories/GHSA-wrjc-x8rr-h8h6. Full package-level advisory URLs and paths remain in the audit JSON.
