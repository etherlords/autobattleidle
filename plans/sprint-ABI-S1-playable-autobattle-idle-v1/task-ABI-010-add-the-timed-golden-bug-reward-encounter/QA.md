---
plannerFormat: 1
id: ABI-010
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-010 qa

## Verdict

PASS — independent local browser QA.

## Evidence

- `pnpm check`: PASS — lint, format, 14 test files / 88 tests, TypeScript, and Vite build; existing chunk-size warning only.
- Reload rule: one Playwright browser operation seeded a valid active V3 fixture, awaited reload, waited 100 ms, and read `Golden Bug escaping in 9.9s`.
- Auto-only: after 10.2 s the bug escaped, coins stayed `100`, reward stayed zero, and progression resumed at Level 51; five automatic-hit logs did not kill it.
- Manual envelope: exactly 50 keyboard-equivalent attacks killed the bug before timeout, awarded `+1,220` exactly once, and did not reset automatic cooldown.
- Progression: `resumeEncounter: 70` returned Boss Level 70 after timeout; ordinary resume also passed.
- Visual/input/responsive: metallic gold and non-color event cue were readable at 1440x900 and 390x844; passive status remained non-interactive and layout did not overflow.
- Persistence: malformed V3 plus valid V2 recovered historical enemy `60/140` and coins `7`.
- Health/resources: console 0 errors/0 warnings, no failed requests observed, one canvas and 55 DOM nodes.
- Receipts: `.playwright-cli/abi-010/golden-desktop-1440x900.png` and `.playwright-cli/abi-010/golden-narrow-390x844.png`.
