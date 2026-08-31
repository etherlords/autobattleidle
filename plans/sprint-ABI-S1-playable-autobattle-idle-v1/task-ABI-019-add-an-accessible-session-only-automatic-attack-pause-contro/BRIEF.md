---
plannerFormat: 1
id: ABI-019
artifact: brief
project: ABI
profile: high-assurance
revision: 5
status: In QA
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

# ABI-019: Add an accessible session-only automatic-attack pause control

## Goal

Add an accessible session-only automatic-attack pause control

## Work item

- Type: task
- Priority: normal
- Status: In QA

## Acceptance criteria

- [ ] A compact two-state control beside the automatic-attack status toggles only automatic attacks: while running it exposes a pause symbol and accessible Pause auto attack action; while paused it exposes a play symbol and accessible Resume auto attack action.
- [ ] Pausing freezes the current automatic cooldown remainder without issuing an attack; resuming continues from that exact remainder and issues no catch-up or duplicate attack.
- [ ] Manual pointer and keyboard attacks, upgrades, modal controls, rendering, persistence, enemy animation, and all non-automatic game behavior remain active while automatic attacks are paused.
- [ ] The pause state is session-only and is not added to the save schema; reload starts automatic attacks running under the normal supported-save restore flow.
- [ ] The control is a real keyboard-focusable button with visible focus, state exposed through accessible name and pressed/status semantics, no color-only cue, and no input leak to the battlefield.
- [ ] Focused tests prove running-to-paused-to-running transitions, frozen remainder, no catch-up/double attack, manual attack during pause, listener disposal, reload default, and compatibility with automatic unlock and the elite automatic-slow modifier.
- [ ] Independent review and desktop/390px browser QA verify button placement near the automatic bar, pointer/keyboard accessibility, modal coexistence, long-run timer stability, pnpm check, and exact-SHA Pages proof.

## Dependencies

- ABI-018

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260828-ECBD82

## Constraints

- Follow the resolved workflow contract and project instructions.
