---
plannerFormat: 1
id: ABI-004
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004 qa

## Verdict

PASS — independent local application/browser QA.

## Evidence

- Independent actor: `autobattle-qa-abi004-final`
- Local URL: `http://127.0.0.1:5173/`
- Real Chromium through Playwright CLI; desktop and `390x844` narrow viewport
- Initial state: Normal Ash Wisp, level 1, normal grade, `10/10` HP, zero coins, automatic attacks locked
- Pointer click: `10/10 -> 9/10`, exactly one manual-hit event
- Keyboard Enter: `9 -> 8`, exactly one event; Space: `8 -> 7`, exactly one event
- Manual/automatic independence: during an elite cooldown, HP `30/40 -> 17/40` while the countdown
  continued from `0.695s -> 0.486s` rather than resetting
- Automatic attack: unlock purchased; countdown visibly approached zero, one attack occurred, and the
  countdown reset near one second for the next interval; repeated HP decrements were observed
- Kill/reward: encounter transitions and coin increases were observed; the bounded six-entry event log
  showed kill and purchase feedback
- Upgrades: automatic unlock, damage, critical chance, double reward, and automatic speed were all
  purchased/exercised; costs, prerequisites, caps, and disabled reasons were observed
- Responsive/accessibility: enemy HUD, HP bar, countdown, controls, and event log remained readable and
  usable at the narrow viewport
- Disposal/stability: focused HUD/application tests prove listener removal and idempotent application
  disposal; browser console reported zero errors and zero warnings
- Slow-elite automatic interval and manual independence: focused deterministic domain proof PASS
- `pnpm vitest run src/domain/combat.test.ts`: PASS, 1 file / 9 tests, 0.197 seconds wall
- Focused Vitest: PASS, 3 files / 11 tests
- `pnpm check`: PASS in 5.26 seconds; existing Vite chunk-size advisory only
- Browser QA elapsed: reported in the independent QA handoff; local server stopped after QA
- No production, Planner, Vault, Git, or task-artifact mutations by QA; `.playwright-cli` remains excluded
