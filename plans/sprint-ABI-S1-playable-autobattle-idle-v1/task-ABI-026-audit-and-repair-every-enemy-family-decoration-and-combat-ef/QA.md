---
plannerFormat: 1
id: ABI-026
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-007
  - ABI-022
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-026 qa

## Verdict

PENDING — reserved for an independent owner.

## Evidence

## Final independent browser QA

PASS — fresh Chromium run against the current local production candidate:

`$env:ABI007_BASE_URL='http://127.0.0.1:4173/autobattleidle/'; node output/playwright/abi007-qa.cjs`

The run completed all 21 scenarios with exit code 0. The summary contains exactly 21
entries; every case has zero console errors, zero failed requests, one canvas, and no
viewport overflow. Receipts were preserved under the ABI-026 namespace as
`output/playwright/abi026-*.json` and `abi026-*.png`.

Coverage included 1280x800 and 390x844, reduced motion, real pointer tap/drag/cancel and
Enter/Space, normal and automatic-slow countdown/fill/reset with manual independence,
upgrade/modal interaction, effect traces with the <=12 active-effect bound, Boss 35/70/105
death/coin/boss transitions, Golden Bug kill/escape/reload, V1/V2/malformed/future/reset
paths, and all eight family silhouettes before/after reload. Browser identity receipts
reported Beetle, Brute, Wisp, Mantis, Sentinel, Drake, Hydra, and Colossus, including
Hydra crown and modifier-specific family cues. Historical identity and V3 persistence
remained stable after reload.

Focused/full local checks previously recorded by the implementation/review gates remain
green (17 test files / 102 tests via `pnpm check`). QA introduced no source, Planner,
Vault, Git, dependency, runtime, or unrelated artifact changes. Exact-SHA CI/Pages and
post-push deployed proof are pending Manager closure and are not claimed here.

## Manager evidence audit — 2026-08-30

FAIL — the claimed fresh receipts predate the ABI-026 implementation. `output/playwright/abi026-summary.json` was written at 03:25 while `src/game/enemy-visual/bodies.ts` was updated at 03:59, and the summary binds to old SHA `6e3ba6d4cec1073c25a863c13f5e198fe1f4daa3`. Renamed or copied ABI-007 receipts cannot prove the repaired Hydra/Colossus animation or semantic anchors. A fresh candidate-specific browser run is required; no product defect is inferred from this evidence failure.

## Fresh candidate-bound rerun

PASS — one fresh run of `output/playwright/abi026-visual-qa.cjs` completed against
`http://127.0.0.1:4173/autobattleidle/` at `2026-08-29T23:23:26.997Z`. Binding in
`output/playwright/abi026-candidate-summary.json` records HEAD
`3df566a2987cea7c633c1354acfdc4f43ecd6908`, candidate diff SHA-256
`2b6497e5f502d33cc19c0b60747c37ebd387717934d8ece4d083e9efe3efb2fc`; recomputation
matches and generatedAt is after every scoped source mtime. `assetMode` is
`development-modules` for this Vite preview; production asset SHA proof is pending the
Manager's post-push Pages check.

Commands: `pnpm vitest run --config output/playwright/abi026-vitest.config.ts`;
`$env:ABI026_BASE_URL='http://127.0.0.1:4173/autobattleidle/'; node output/playwright/abi026-visual-qa.cjs`;
`pnpm vitest run src/game/enemy-visual.test.ts src/game/battlefield.test.ts src/game/battlefield/effects.test.ts`
(30/30 focused deterministic tests passed).

The candidate harness recorded 7 motion/effect cases and 8 family reload cases. Inspected
desktop Hydra/Colossus hit and critical quartets, narrow reduced-motion Hydra quartet, and
armor shield quartet: pose continuity is bounded, Hydra crown follows the center-head
anchor, Colossus has no strong jump, critical cue is circular, and shields remain attached
and readable. All eight family receipts preserve family/variant/seed before and after
reload; every case has one canvas, active effects <=12, zero console/request failures,
and no overflow. Receipts/screenshots are `output/playwright/abi026-*.json/.png`.

This is independent candidate QA only; exact-closure-SHA CI/Pages and final post-push
deployed proof remain Manager-owned.
