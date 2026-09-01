---
plannerFormat: 1
id: ABI-040
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-013
  - ABI-020
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-040 verification

## Acceptance evidence

- Implementation self-check: PASS — focused 20/20 and canonical `pnpm check` 183/183.
- Independent review: PASS after one bounded repair set.
- Independent local QA: PASS in isolated storage/browser context.
- Vault: `Persistence Contract` records strict V3 -> V2 -> legacy -> V1 precedence, valid-V4 startup,
  explicit Restore, historical derived-semantics validation, and stale-pending cancellation.
- Publication/deployed acceptance: PASS at commit `204cb4c3ede153d925d7ad58654efe892212f5b7`;
  CI `33454549754` and Pages `33454549765` succeeded. Served JS SHA-256 is
  `d1b667064807f107a50df363bb898dd2347ab4eb3327a1386b801c49bdd2a252`.
- Deployed acceptance: isolated v3 2170 migrated/restored/reloaded at 2170 with coins/levels/unlock and
  historical bytes preserved; valid V4 won normal startup; console/network clean.

## Sign-off

- Reviewer: APPROVE (fresh rerun)
- QA: PASS local and deployed exact-SHA
- Manager close: PASS
