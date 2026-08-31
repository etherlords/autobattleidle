---
plannerFormat: 1
id: ABI-019
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-019 implementation-guide

## Frozen scope

- Add only an automatic scheduler pause. Manual attacks, camera, upgrades, dialogs, rendering, Golden
  Bug time, persistence, and enemy animation remain live.
- Running button: pause symbol plus accessible `Pause auto attack`. Paused button: play symbol plus
  accessible `Resume auto attack`. Use native button/disabled/focus behavior and non-color text/ARIA.
- Pause state and frozen remainder are controller-session fields, never `CombatState`, save contracts,
  migrations, localStorage, or leaderboard payloads.

## Implementation sequence

1. Extend the existing battle command/update contract with one toggle and paused/effective-remainder
   presentation state.
2. Implement freeze/resume beside `performFrame`; paused frames keep updating ordinary timers but never
   dispatch automatic damage.
3. Add the compact native HUD button, named intent, render state, listener cleanup, and minimal CSS next
   to the existing automatic status.
4. Add focused controller/HUD/application regressions and one supported historical-save reload default.
5. Run `pnpm check`, then independent review and deployed desktop/390px QA.

## Verification matrix

- Unit: running -> paused -> running, exact remainder, no catch-up/duplicate, manual attack during pause,
  automatic unlock, elite slow, reset/restore running, and listener disposal.
- Integration: button intent reaches the controller, render reflects pressed/name state, upgrades/modal
  continue, and persisted combat payload contains no pause field.
- Deployed: pointer and keyboard toggle, placement beside automatic status, desktop/390px layout,
  focus/no battlefield input leak, long-run timer stability, reload starts running, clean console.
