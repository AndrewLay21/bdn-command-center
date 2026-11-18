> Follow-up completed: see [validated repair batch](/bdn-validation-2026-10-16.md) for exact source867348bc,292 passing tests, current15-entry audit and now-verified production SHA. The phase-one baseline below is historical.

# Big Dreams Network website — baseline and first isolated repair

As of October 16, 2026. Owner: Codex. Mission: BDN-AEO-001. Audit and isolated development only; no production release authorization.

## Verified source state

Repository: DigitalBlueprint239/dream-field-hub-5bd41c59 (private). Default branch main: `8857733b0a5a22b63f90ff802866a3b0cc69d5cc`.

Media Engine: PR #38 is open, unmerged and draft at `9ba6ca30de5c679c029ad7178a1fbe4e63d0e160`, based on that main revision. GitHub reports a successful Netlify Deploy Preview status for this revision. A successful preview status is not production acceptance. The exact currently served production SHA has not been established here.

Architecture: React 18 / TypeScript / Vite static app, React Router, repository-owned editorial and media pipelines. Media generation consumes private authoring batches and emits a public manifest; News and media routes coexist with existing shows. The Business of the Game is a show within this hub, separate from human reporting.

Candidate feature flags: News ON; flag hub, submissions, admin, directory inquiry, event registration, lead capture and newsletter OFF. This is read from the candidate source, not a claim about deployed configuration. Older “News OFF” context is superseded for this candidate only. No flags changed.

## Directed independent checks

Fetched exact source blobs `src/media/publicReferences.ts` (`5b48b538708eefa25e6f658b6b74480fa8fe630d`) and `src/media/applicationReferences.ts` (`f9f5f9681c061503c6f7d73ee41854c37d1216f7`). Compiled unchanged with TypeScript and executed a separate directed probe: **92 passed / 0 failed** on Node v24.19.0.

Coverage: neutral private editorial/media/newsroom paths; bare and encoded references; query/fragment rejection; manifest/prose/artifact guards; local/numeric hosts and embedded credentials; ordinary public citations and local links; registered player references versus forged references. This supports these two policy modules only. It is not a rerun of the repository suite, full HTML/JSON-LD rendering, build, browser, physical-device or rights acceptance. Probe source and results are retained with this report.

Historical source report claims 199/199 tests and media/newsroom privacy builds passed after the initial privacy correction. Those are inherited agent results, not rerun here. The current head includes additional boundary-v2/v3 tests and newer guards; the initial remediation note is not sufficient final-head acceptance evidence.

## Confirmed configuration issue and smallest repair

`vite.config.ts` sets `server.host` to `"::"`, the IPv6 wildcard address. A developer starting this server configures it to listen beyond loopback, subject to host/network reachability. The security register treats development-server advisories as relevant and says not to expose the vulnerable server. This does not establish an exploitable public production-site vulnerability or prove that a development server is currently running.

Smallest isolated repair: set the development host to `127.0.0.1`, retaining port 8080, HMR, plugins, routes, feature flags, assets and dependencies. Developers who deliberately need another bind address must opt in through the Vite CLI in a controlled environment. Production output is not the target of this setting. Validate the actual config export before/after; a full build remains separate.

## Prioritized remaining gates

| Priority | Owner | Next result | Completion evidence |
|---|---|---|---|
| 1 | Codex | Final-head privacy and build replay | Exact SHA; existing boundary-v2/v3, media, editorial and artifact tests; no suppressed failures |
| 2 | Codex | Current dependency exposure review | Fresh audit with resolved package versions and runtime/toolchain paths; historical 21-package count is not current verification |
| 3 | Codex | Deployed-state and delivery baseline | Production deployment SHA/config and measured bundle/page metrics; currently NOT MEASURED |
| 4 | Engineering review | Browser/player/mobile acceptance | Approved provider IDs; keyboard/loading/failure behavior and physical-device evidence; synthetic IDs are not playable-audio proof |
| 5 | Coach Drew | Content and release decisions | Exact-revision sources, rights, AI disclosures, approved assets and separate production authorization |

The source security register reports 21 affected packages (2 critical, 14 high, 5 moderate), largely development/test graph. This count is historical source evidence only; no current advisory lookup, install/audit or exploit verification was performed. No major/forced upgrades recommended from counts alone.

Missing original executive v1.0 scope remains an inventory limitation. It does not prevent this bounded blocker report, but no complete portfolio or website-release claim follows.

## Business purpose and limits

This work protects the content engine that can organize original shows, interviews and articles, improve discoverability and support sponsor discovery. No reach, traffic, lead or revenue increase has been measured. Publishing is not unlocked by test results alone.

Coach Core remains separate and MVP NO-GO. Its independent testing can continue while this website audit proceeds. No content published, forms submitted, source packages imported, credentials changed, production deployment, merge, spend, Supabase/Queens modification or feature activation.

Rollback of the proposed development-host change is a one-line reviewed revert on the isolated branch. Preserve the current PR #38 and main revisions. Do not use a rollback to claim privacy acceptance.

Sources: [PR38](https://github.com/DigitalBlueprint239/dream-field-hub-5bd41c59/pull/38), exact candidate files `vite.config.ts`, `src/lib/features.ts`, `src/App.tsx`, `media/schema.ts`, `media/build.ts`, `media/privacy-remediation.md`, `media/security-register.md`, and both public-reference modules above.

First repair is now delivered in [draft PR39](https://github.com/DigitalBlueprint239/dream-field-hub-5bd41c59/pull/39), stacked on the unchanged PR38 branch. Source repair6bf0ae70b668bfbdb40b2d0f196897849fc45e5b; docs/evidence head01e54ea05a38f8d867aec1e842fc8f033459c5ed. Config export check passed with only host differing. No merge or production deployment.
