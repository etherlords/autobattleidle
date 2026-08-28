---
plannerFormat: 1
id: ABI-009
artifact: qa
project: ABI
profile: high-assurance
revision: 4
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-003
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-009 qa

## Verdict

PASS — independent QA found no P0-P2 defects or blockers.

## Evidence

- Owner: `independent-qa-abi009`; typed gate receipt
  `evt-c082cf5b-7b1d-4f8f-9ec1-ac462761cfd9` at progress revision 26.
- Real Chromium at `http://127.0.0.1:4179/`: desktop 1440x900 and narrow 390x844.
- Live pointer attack changed health 140 -> 139 and emitted exactly one `Manual hit: 1 damage`.
- The browser dynamically imported the production factory and rendered ten labeled cases covering
  beetle, brute, wisp, boss-colossus, boss-hydra, armor, vitality, automatic-slow, explicitly
  synthetic dormant wealth, and boss/modifier combinations.
- Narrow live app remained bounded (`scrollWidth=390`, `innerWidth=390`) with no overflow.
- 120 actual WebGL replacements kept scene children bounded at 12; stable seeds matched; retired
  groups were traversed/disposed and the renderer was disposed.
- Console errors: 0. Failed requests: 0.
- Focused factory/battlefield tests: 6/6. `pnpm check`: lint, formatting, 23/23 tests,
  TypeScript, and Vite build PASS. Historical-save load/reload regression remained green.
- Receipt: `output/playwright/abi009/qa-receipt.md`.
- Screenshots: `desktop-initial.png`, `desktop-after-attack.png`, `desktop-gallery.png`,
  `narrow-live.png`, and `narrow-gallery.png` under `output/playwright/abi009/`.

The live domain still emits only armor, health, and automatic-slow. Wealth was proven solely as a
clearly labeled synthetic dormant composition; QA did not infer or activate reward state.
