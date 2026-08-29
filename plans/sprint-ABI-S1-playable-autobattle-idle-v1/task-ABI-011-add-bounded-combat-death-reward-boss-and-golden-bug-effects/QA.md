---
plannerFormat: 1
id: ABI-011
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-011 qa

## Verdict

PASS — fresh isolated Playwright contexts loaded codec-generated V3 fixtures and proved every
delegated recovery case at the application UI layer. No product defect observed.

## Acceptance matrix

| Criterion | Exact command/scenario | Result/artifact |
|---|---|---|
| Armor hit | `node output/playwright/abi011-fixture-route.cjs`; V3 `spawnEnemy(3,0)` fixture, 1280x800, focus battlefield, Enter | PASS: `282/282 -> 281/282`, armored UI; `output/playwright/abi011-armor-hit.png` |
| Critical hit | Same route; V3 `createCombatState({criticalLevel:100,criticalChance:criticalChanceForLevel(100)})`, Enter | PASS: `210/210 -> 208/210`; `output/playwright/abi011-critical-hit.png` |
| Boss death/spawn | Same route; V3 `spawnEnemy(35,0)` with canonical enemy health set to 1, one Enter | PASS: `Boss ... 1/1,500 -> Elite ... 300/300`, `+420 coins`; `output/playwright/abi011-boss-transition.png` |
| Golden Bug kill | Same route; V3 `spawnGoldenBug(51, player)` with canonical health 1, one Enter | PASS: `1/6,585 -> Elite level 51`, `+1,220 coins`; `output/playwright/abi011-golden-bug-kill.png` |
| Golden Bug escape + reduced motion/narrow | Same route; V3 `spawnGoldenBug(51, player)`, 390x844, `reducedMotion: reduce`, wait 10.5s | PASS: countdown -> `Golden Bug escaped.` -> resumed Elite; body `390x844`, one canvas, clean console; `output/playwright/abi011-golden-bug-escape-reduced-narrow.png` |
| Long-session bounds | Same route; isolated 1280x800 context, wait 30s on active bug | PASS: escape/resume observed; body `1280x800`, one canvas, 72 resources, heap `16,870,416`, clean console; `output/playwright/abi011-long-session.png` |

## Commands and fixture validation

- Fixture generation: `pnpm exec vitest run --config output/playwright/abi011-vitest.config.ts` — 1
  test passed. `output/playwright/abi011-generate-fixtures.test.ts` imports
  `createCombatState`, `damageForLevel`, `criticalChanceForLevel`, `spawnEnemy`, `spawnGoldenBug`,
  `encodeSave`, and `decodeSave`; it asserts decode/re-encode byte identity for every fixture. No
  hand-authored save schema was used. The executable provenance and config are retained.
- Browser server: `pnpm preview --host 127.0.0.1 --port 4174`.
- Browser route: `node output/playwright/abi011-fixture-route.cjs` — exit code 0; all six cases
  loaded `http://127.0.0.1:4174/` through fresh `context.addInitScript()` contexts after the rebuilt
  app. Re-run figures: armor `282 -> 281`, critical `210 -> 208`, boss spawn `+420 coins`, Golden
  Bug kill `+1,220 coins`, narrow escape body `390x844`/one canvas/72 resources/heap `17,856,983`,
  and long session body `1280x800`/one canvas/72 resources/heap `17,156,344`; all `errors: []`.
- Full quality gate: `pnpm check` — lint clean, Prettier clean, 15 test files and 93/93 tests passed,
  TypeScript build and Vite production build passed (existing chunk-size warning only).
- All cases had `errors: []`; each context was closed and browser closed. No existing origin/save,
  production source, dependencies, Git, Vault, ABI-019, or ABI-020 were changed.
