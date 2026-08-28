---
plannerFormat: 1
id: ABI-003
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

# ABI-003 qa

## Verdict

PASS — independent local browser QA, 2026-08-28.

## Evidence

### Browser and functional transitions

- URL `http://127.0.0.1:5173/`, Chromium desktop `1280x720`: one canvas, player/enemy
  spatially separated, clean console (0 errors, 0 warnings).
- Pointer attack: `10/10 -> 9/10`, exactly one `Manual hit: 1 damage`; Enter:
  `9/10 -> 8/10`, one additional manual event.
- Automatic attack unlocked; after 1.15 seconds veteran HP decreased `23 -> 17`, automatic events
  appeared, and the visible cooldown continued/reset.
- Deterministic progression reached normal level 1, veteran level 2, elite level 3 with armor,
  elite level 9 with health, boss level 10, then normal level 13. Boss HP visibly shrank from 165;
  rewards reached 127 coins and the event log remained capped at six.

### Visual identity and transient feedback

- Normal uses a dodecahedron; veteran a box; elite an octahedron at scale 1.12 with a separate armor
  torus; boss a scale-1.45 cone with separate crown geometry. Identity does not depend on color.
- Frozen-frame browser evidence captures the expanding light hit ring after a pointer attack and the
  combined death/spawn rings over the replacement veteran encounter. The boss screenshot captures the
  boss cue and shrinking HP. Freezing RAF happened only after input as QA instrumentation.
- Evidence: `output/playwright/abi003-grade-normal.png`, `abi003-grade-veteran.png`,
  `abi003-grade-elite.png`, `abi003-hit-frozen.png`, `abi003-death-frozen.png`,
  `abi003-boss.png`, `abi003-desktop.png`, and `abi003-narrow.png`.

### Responsive and bounded resources

- Narrow `390x844`: `scrollWidth=390`, no horizontal overflow; HUD, HP, cooldown, controls, event log,
  and boss canvas remained visible.
- Six-second automatic run: canvas count `1 -> 1`, event rows `6 -> 6`, body text length
  `432 -> 432`. Reload returned to one canvas and two `#app` children with clean console.
- Focused lifecycle test constructs the scene and proves enemy/effect retirement, bounded effect
  admission, scene clearing, and idempotent renderer/canvas disposal.

### Commands and hygiene

- `pnpm vitest run src/game/battlefield.test.ts`: 1 file, 3/3 PASS, 0.240 seconds.
- `pnpm check`: lint, format, 4 files/14 tests, TypeScript and Vite build PASS, 5.812 seconds;
  existing >500 KB chunk advisory only.
- QA made no production/test/Planner/Vault/Git mutations. Screenshots are scoped evidence under
  `output/playwright/`; `.playwright-cli/` remains unstaged and is excluded from delivery.
