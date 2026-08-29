---
plannerFormat: 1
id: ABI-018
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018 verification

## Acceptance evidence

- Release candidate: `df32e4ff9d7006dc9084d099d09236311262a3ea`, pushed to `main`; native pre-commit hook ran the full `pnpm check` gate successfully.
- Exact-SHA CI: run `33256713258`, job `99111613731`, `success` — https://github.com/etherlords/autobattleidle/actions/runs/33256713258
- Exact-SHA Pages: run `33256713311`, job `99111614020`, `success` — https://github.com/etherlords/autobattleidle/actions/runs/33256713311
- Deployed URL: https://etherlords.github.io/autobattleidle/
- Deployed browser proof: locked HUD rendered `Automatic attack: locked · 0.10 APS`; the upgrades modal exposed damage, armor penetration, critical chance, double reward, and APS with native button states and reasons. At 390 px, document client/scroll widths were `390/390` and dialog width was `366`; console reported 0 errors and 0 warnings. Screenshot: `.playwright-cli/page-2026-08-29T14-09-01-526Z.png`.
- Formula and regression proof: `APS(L) = 0.1 + 2.9 * L² / (L² + 150²)` uses a stable ratio, is monotone, and remains strictly below 3 APS; the elite automatic-slow modifier still adds exactly 500 ms. `pnpm check` passed lint, format check, 14 test files / 89 tests, typecheck, and build.
- Persistence impact is `no schema change`: derived player stats are snapshot-only. Independent QA proved supported V3 reload and invalid-V3 plus supported-V2 migration retained progress and republished canonical V3 without reset.
- Deterministic progression regression passed with 2,780 automatic attacks and boss timestamps `8079407.359888906`, `18222883.009831183`, and `25581417.26164943` ms.

## Sign-off

- Reviewer: APPROVE after one bounded repair and fresh independent re-review; no remaining P0-P3 findings.
- QA: PASS for desktop and 390x844 behavior, accessibility, persistence, progression, and console health.
- Manager close: verification evidence accepted; final closure gate and final checkpoint remain pending.
