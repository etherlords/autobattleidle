# ABI-009 independent QA receipt

Date: 2026-08-28 (Asia/Tashkent)
URL: http://127.0.0.1:4179/

## Commands

- `pnpm test -- src/game/enemy-visual.test.ts src/game/battlefield.test.ts` — 2 files, 6 tests passed.
- `pnpm check` — lint, format check, 6 test files / 23 tests, `tsc -b`, and Vite build passed. Build emitted only the existing chunk-size advisory.
- `pnpm dev -- --port 4179` / `pnpm exec vite --host 127.0.0.1 --port 4179` — local server reachable.
- Playwright CLI (`npx --yes --package @playwright/cli playwright-cli -s=abi009`) real Chromium session.

## Browser scenarios

| Viewport | Scenario                                | Expected                                           | Actual                                                                                                                                                                                                                                                                                       |
| -------- | --------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440x900 | First load                              | Render battlefield/HUD                             | Canvas rendered; HUD showed Normal Ash Wisp, Level 1, 140/140; no console errors. Screenshot: `desktop-initial.png`                                                                                                                                                                          |
| 1440x900 | Pointer attack                          | Snapshot replacement/attack changes state          | Dispatching real `pointerup` on `.battlefield` changed health 140 -> 139 and added `Manual hit: 1 damage`; screenshot: `desktop-after-attack.png`                                                                                                                                            |
| 1440x900 | Synthetic source-factory gallery        | Every body/modifier/boss combination readable      | Actual `createEnemyVisual` dynamically imported from `/src/game/enemy-visual.ts`; 10 labeled combinations rendered: beetle, brute, wisp, boss-colossus, boss-hydra; armor, vitality, automatic-slow, synthetic dormant wealth; boss+modifier combinations. Screenshot: `desktop-gallery.png` |
| 390x844  | Live responsive load and pointer attack | No horizontal overflow; interaction remains usable | `scrollWidth=390`, `innerWidth=390`, `overflow=false`; canvas width 390; pointerup changed health and event log updated. Screenshot: `narrow-live.png`                                                                                                                                       |
| 390x844  | Synthetic gallery                       | Factory remains callable in narrow browser         | 10 actual factory groups rendered and source labels captured: `narrow-gallery.png`; the gallery-only labels exceed the narrow viewport, so responsive verdict is based on the real app above.                                                                                                |

## Determinism and lifecycle

The browser gallery dynamically imported the production source factory and rendered actual Three.js WebGL objects. Repeated `stableEnemySeed` calls matched for all 10 cases (`stableSeeds=true`). Metrics from 120 replacement iterations: `initialChildren=11`, `maxChildren=12`, `beforeDispose=11`, group child counts `[3,7,6,5,8,6,7,6,7,5]`; all replacement groups were traversed and disposed, renderer disposed. No unbounded scene growth observed.

## Persistence and health

The full `pnpm check` includes the historical-save load/reload regression suite (23/23 passed). Browser console reported zero errors; network requests loaded the Vite shell/modules successfully (14 static requests; no failed requests observed).

Verdict: PASS for ABI-009 acceptance. No P0-P2 findings. Wealth was exercised only as the explicitly labeled synthetic dormant cue; live domain reward semantics remain untouched.
