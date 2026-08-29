---
plannerFormat: 1
id: ABI-017
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-017 qa

## Verdict

PASS — independent browser and regression QA.

## Evidence

- `pnpm check`: lint, format, TypeScript, build, and 73 tests pass.
- Real Playwright browser at `http://127.0.0.1:5173/`: desktop and 390x844.
- Default pointer purchase advanced one level; Shift advanced ten; Ctrl stopped coherently after three affordable levels in the seeded state; no failed debit/event.
- Modifier-held keyboard activation advanced exactly one level.
- One V2 payload persisted the exact final state and reload restored it; V1/V2 historical and malformed-save regressions pass in the persistence tests.
- Bulk hint is visible and aria-readable. Escape/backdrop/U dismissal, focus trap/restore, disabled reasons, and battlefield input isolation pass.
- At 390px: hint readable, no horizontal overflow (`scrollX=0`, `scrollWidth=clientWidth=390`). Console: 0 errors, 0 warnings.

Residual: historical V1 migration was proven by deterministic persistence tests rather than repeated interactively because pagehide saved the active V2 state over the injected browser setup.
