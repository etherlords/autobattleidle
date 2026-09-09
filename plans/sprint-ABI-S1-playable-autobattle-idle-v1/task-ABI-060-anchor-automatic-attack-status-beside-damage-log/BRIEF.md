---
plannerFormat: 1
id: ABI-060
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-060: Anchor automatic attack status beside damage log

## Goal

Anchor automatic attack status beside damage log

## Work item

- Type: task
- Priority: high
- Status: Done
- Parent: None

## Acceptance criteria

- [ ] [unit] Position .automatic-status as a deliberate scene-safe strip directly above the damage log at the log width, or use a compact action-adjacent strip when that is more robust; preserve cooldown/progress/pause behavior and ARIA.
- [ ] [unit] Keep the automatic status out of the central battle scene at desktop and narrow breakpoints while retaining readable progress and pause controls.
- [ ] [integration] Preserve canvas pointer/keyboard input, mute/audio, manual actions, event log, HUD intents, and dense event-log separation at 1280px, 390px, and 320px.
- [ ] [deployed] Verify real browser geometry and screenshots at 1280px, 390px, and 320px with no overlap, page overflow, or console errors.
- [ ] [persistence] No schema change; historical saves remain loadable and reloadable.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
