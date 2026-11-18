# Big Dreams Network — hosted acceptance follow-up

As of October 16, 2026. Status: PARTIAL IMPLEMENTATION-OWNER ACCEPTANCE; release gates remain open. No production merge or publication.

## Candidate and method

Tested deployed commit: `2357c818ba827f6a0a9f2fda596e8f47fe036633`, whose application source is the previously tested repair commit `867348bc5304cda5f67cd62e68f3927f57d06077` (the intervening commit contains documentation/evidence only). Netlify deploy `6ad219cd91f95ac975b2e5ee` is ready in the deploy-preview context. Draft PR40 is a validation carrier against main because stacked PR39 did not receive its own preview. Do not merge the carrier; PR38 and PR39 remain separate drafts.

- Preview: https://deploy-preview-40--deluxe-caramel-cd62a5.netlify.app
- Repair PR: https://github.com/DigitalBlueprint239/dream-field-hub-5bd41c59/pull/39
- Carrier PR: https://github.com/DigitalBlueprint239/dream-field-hub-5bd41c59/pull/40
- Browser: hosted Chrome, desktop viewport 1363×936. Cloud UI controls and read-only DOM inspection; no local browser server or alternate automation installed. No mobile viewport control was available.
- HTTP checks are separate urllib requests, not browser or accessibility assertions. Their raw status/size/hash results are retained in `evidence/2026-10-16/hosted-http-checks.json`.
- Browser findings below are manual observations from the cloud-browser tool, not a recorded automated test suite or independent review. No user data was entered or form submitted.

## Browser results

| Journey | Observation | Acceptance limit |
| --- | --- | --- |
| Homepage | Renders with Big Dreams Network branding; document width1348 within viewport1363 | No desktop horizontal overflow observed; phone in crowded header wraps into four lines. Header readability defect remains open. |
| Keyboard navigation | Enter opens Watch / News menu and News & Rankings navigates to News | Sample keyboard journey passes; not a complete accessibility audit. |
| News filtering and article | Enter selects Network Updates (`aria-pressed=true`); the sole published Article001 opens with correct heading and production canonical URL | No additional content activated or rights accepted. |
| Malformed fragment | `/about#%E0%A4%A` displays About content without a captured URIError | Browser evidence supports the repaired malformed-hash case; not proof of every recovery path. |
| Watch replay | No YouTube iframe before activation. Enter on existing replay loads the titled `youtube-nocookie.com/embed/fzFau3TNttk` iframe and real provider metadata/duration58:54 | After provider Play, observed video remained time0, readyState0, paused=false, error=null. Actual media progress/audio NOT VERIFIED; do not claim playback passes or that the site is broken. No bot challenge was observed. |
| Podcasts | Displays “No podcast episodes are available yet.” | No approved Spotify episode exists in this candidate. Actual Spotify playback remains untested; no fabricated episode imported. |
| Flag Football | Coming Soon link opens the rebuilt/unavailable hub message and Contact BDN link | Flag state preserved; forms not activated. |
| Console | Captured error came from a chrome-extension URL and browser-metadata messaging | Extension noise is not attributed to application code. |

HTTP checks: all11 matched their expected statuses. Homepage, Watch, News, the published article, Podcasts and Coaches Corner returned200. Two synthetic unpublished routes and three synthetic private-path probes returned404. The latter do not prove every real private record is inaccessible; the earlier actual-build privacy canaries remain the broader retained evidence.

## Sponsor journey: highest-priority business finding

The preview's Start Sponsor Intake link opens https://sponsor.bigdreamsnetwork.com/ with a visible inquiry form. Navigation succeeds; delivery to CRM, acknowledgements and follow-up were not tested because no submission was authorized.

| Surface | Website preview | Existing external intake |
| --- | --- | --- |
| Parent identity | Big Dreams Network / BDN | Big Dreams Sports Network / BDSN in title, navigation, body, CTA and privacy copy |
| Featured Partner social deliverable | “2 monthly sponsored social posts” | “Three social media features per month” |
| Visible monthly prices | Community299; Featured599; Premier999; Title2500+ (USD) | Same displayed price points; matching prices do not establish current offer approval |

Other tier inclusions also differ. These are observed public claims, not newly approved terms. Historical planning prices are not used as authority. The external funnel also references2024–25 coverage and promises a two-business-day response; those commitments need owner verification.

Recommended next bounded task: reconcile the current approved offer and parent identity across `/advertise`, `/media-kit` and the existing sponsor funnel. Use **Big Dreams Network / BDN** for the parent and **Big Dreams Sports TV** for the media channel. Preserve accurate historical media titles. Confirm the authoritative per-tier deliverables before changing quantities, pricing, contract language or response promises. The external funnel is outside this repository; no external workflow or funnel edit was performed.

## Dependency exposure review

The locked audit remains **15 affected-package entries:2 critical,6 high,7 moderate**. Counts are packages, not unique vulnerabilities or demonstrated public exploits. No risk waiver or forced upgrade. Sources were checked against the current GitHub advisories linked below; installed dependency paths are retained in `evidence/2026-10-16/dependency-paths.txt`.

| Packages (all15 accounted for) | Verified source/config and conditions | Disposition |
| --- | --- | --- |
| tinypool; vitest; @vitest/mocker | Vitest is invoked with `vitest run`, not a public UI/API; config has app/media/editorial/newsroom projects, no browser mode or public custom mocker plugin. Installed Vitest calls Tinypool with custom run option objects; filename prototype fallback exists in installed Tinypool1.1.1. Both prototype-pollution advisories remain relevant to trusted developer/CI processes if an upstream pollution primitive is reached. No such primitive or exploit was demonstrated. | Critical tooling risk remains open. Isolate test/build credentials, review changes before executing them, avoid exposing test interfaces. Migrate Vitest with its supported worker graph in a separate candidate; do not override Tinypool across an unsupported major. |
| vite; esbuild | Vite config binds the dev server to127.0.0.1. Netlify preview is static output with no deployed Functions/Edge Functions, rather than a Vite/esbuild development server. Vite map traversal needs a reachable dev server; two advisories concern Windows paths/editor endpoints. Localhost alone is not a cure for the esbuild cross-origin advisory. | Developer exposure remains; production-static inference is limited to this observed deployment. Do not expose development tooling. Review a supported Vite migration with build/route/privacy checks. |
| react-router; react-router-dom | App uses BrowserRouter/Routes and createRoot; no Framework/Data Router SSR hydration/deserialization API found. The SSR advisory expressly excludes Declarative Mode. For the separate backslash redirect advisory, inspected navigate calls use literal routes or repository-owned slug prefixes; LeadCapture's optional redirect prop has no caller supplying it. Contact subject is encoded under a fixed prefix. No attacker-controlled raw navigation target identified in this source review. | Browser runtime findings retained. Source review is not exhaustive independent proof of unreachable input. Review/upgrade Router and exercise hostile URL/deep-link behavior in an isolated candidate. |
| tailwindcss; @tailwindcss/typography; braces; chokidar; fast-glob; micromatch; postcss-nested; postcss-selector-parser | Build/config dependencies process repository-owned file globs, CSS and selectors. Braces recursion requires hostile nested patterns; selector-parser CPU exhaustion requires hostile selector input. No synchronous public selector/glob processing endpoint found in this static deployment. Some packages are installed through a production dependency path; npm's dev flag alone does not determine browser execution. | Keep all8 entries open. Trust and review build input, including dependency/content changes. Plan CSS migration without unsupported transitive overrides or accepting an npm-suggested downgrade blindly. |

This review does not prove the live main revision shares this candidate's dependency graph, nor establish absence of all exploitable paths. The two Tinypool conditions must not be described as fixed by trusted configuration. No exploit payload was executed against the provider, production or CI.

Primary advisory references (retrieved October16):

- https://github.com/advisories/GHSA-85c8-ppgw-ccpr — Tinypool run options, patched2.1.2.
- https://github.com/advisories/GHSA-5gmw-xhrv-c9v3 — Tinypool worker options, patched2.1.1; the later run-options advisory still requires2.1.2.
- https://github.com/advisories/GHSA-82fw-gwwq-j7x9 — mocker file-read conditions; supported patched Vitest/mocker line required.
- https://github.com/advisories/GHSA-wrjc-x8rr-h8h6 — Router backslash redirect.
- https://github.com/advisories/GHSA-337j-9hxr-rhxg — Router SSR conditions; excludes Declarative Mode.
- https://github.com/advisories/GHSA-4w7w-66w2-5vf9 — Vite optimized map traversal.
- https://github.com/advisories/GHSA-v6wh-96g9-6wx3 — Windows editor UNC disclosure.
- https://github.com/advisories/GHSA-fx2h-pf6j-xcff — Windows Vite filesystem deny bypass.
- https://github.com/advisories/GHSA-67mh-4wv8-2f99 — esbuild development-server cross-origin access.
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm — braces nested-pattern denial of service.
- https://github.com/advisories/GHSA-rj75-hqrm-r3gf — selector-parser CPU exhaustion; ordinary trusted build use excluded by advisory.

## Open gates and next actions

1. Independently review/replay repair source and retained failures/privacy checks. Existing292-pass suite is unchanged; no duplicate run claimed for this documentation-only phase.
2. Reconcile sponsor identity and approved offer across website/media kit/external intake; check real delivery only with an authorized test submission.
3. Repair header readability in a separate small source change and recheck relevant desktop/mobile layouts.
4. Verify actual YouTube media progress/audio and an approved Spotify episode on supported real devices, including touch controls and keyboard recovery. Physical devices/mobile emulation remain untested here.
5. Review supported dependency migrations and measured route splitting separately. No Lighthouse, timing or conversion improvement claimed.

Production main remains `8857733b0a5a22b63f90ff802866a3b0cc69d5cc`. No source changes in this follow-up; no new content, form submission, flag, pricing, Supabase, Queens or Coach Core changes. No merge/deploy authorization is implied by these results.
