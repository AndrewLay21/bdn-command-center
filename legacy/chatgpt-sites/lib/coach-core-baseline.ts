export const baselineWorkstreams=[
  {
    "n": "01",
    "title": "Same-name team confirmation",
    "status": "Verified on 518e9e5",
    "kind": "verified",
    "detail": "R7/R7b passed 10/10 per desktop engine; explicit confirmation and pending-operation retry safety verified on the exact runtime.",
    "owner": "Claude \u00b7 independent acceptance"
  },
  {
    "n": "02",
    "title": "Readback failure recovery",
    "status": "Verified with injected faults",
    "kind": "verified",
    "detail": "Corrected R8b harness4cc7ccf proves real readback failure, no false success at8s and same-operation recovery. Historical vacuous passes remain historical.",
    "owner": "Claude \u00b7 independent acceptance"
  },
  {
    "n": "03",
    "title": "Selected-team persistence",
    "status": "Repair supported \u00b7 monitor",
    "kind": "progress",
    "detail": "Repair implemented on518e9e5; post-creation variant absent0/200 targeted runs. Separate D10 readiness checkpoint remains open.",
    "owner": "Codex repair \u00b7 Claude verification"
  },
  {
    "n": "04",
    "title": "D10-06e phone flake",
    "status": "Captured cause explained \u00b7 rerun pending",
    "kind": "awaiting",
    "detail": "ba881bd identifies one captured premature harness read before team readiness. Claude checkpoint correction/retest pending; other historical failures not blanket-closed.",
    "owner": "Claude \u00b7 readiness and independent acceptance"
  },
  {
    "n": "05",
    "title": "N3 \u00b7 no-submit observation",
    "status": "Reproduced symptom \u00b7 cause unresolved",
    "kind": "inherited",
    "detail": "Earlier Firefox DOM submit event absent. No recurrence in latest batch does not establish a fix. Preserve discriminating probes; SDK stall is separate.",
    "owner": "Claude \u00b7 diagnosis"
  },
  {
    "n": "06",
    "title": "H2 Firefox timeout",
    "status": "Open",
    "kind": "open",
    "detail": "Unexplained Firefox timeout remains a release risk.",
    "owner": "Claude \u00b7 release evidence"
  },
  {
    "n": "07",
    "title": "FX-02 delay",
    "status": "Artifacts delivered \u00b7 cause open",
    "kind": "open",
    "detail": "Redacted logs and decoded DOM recovered at ba881bd. Sampled button presence does not explain the intervening stall.",
    "owner": "Claude \u00b7 evidence review"
  },
  {
    "n": "08",
    "title": "Import edge cases",
    "status": "PR72 repair \u00b7 acceptance pending",
    "kind": "awaiting",
    "detail": "R3/R4/R1c review delivered. Narrow status-less original-team claim fallback at35e0d778;489/489 unit tests agent-reported. Independent browser acceptance and product/config choices remain.",
    "owner": "Claude \u00b7 acceptance; Coach Drew \u00b7 policy decisions"
  },
  {
    "n": "09",
    "title": "Standalone touch navigation exit",
    "status": "Untested",
    "kind": "untested",
    "detail": "Retained standalone touch exit and physical devices still require validation.",
    "owner": "Release gate"
  },
  {
    "n": "10",
    "title": "Background-tab behavior",
    "status": "Untested",
    "kind": "untested",
    "detail": "Genuine hidden/background-tab behavior requires validation.",
    "owner": "Claude \u00b7 release gate"
  },
  {
    "n": "11",
    "title": "Real devices and staging",
    "status": "Untested \u00b7 release gate",
    "kind": "untested",
    "detail": "Phone-width desktop runs do not establish physical-device readiness. Founder config checks, real auth and staging/device proof remain.",
    "owner": "Coach Drew \u00b7 config; engineering \u00b7 validation"
  }
];
