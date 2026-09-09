---
plannerFormat: 1
id: ABI-058
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

# ABI-058: Refine HUD health and auto-attack layout

## Goal

Refine HUD health and auto-attack layout

## Work item

- Type: task
- Priority: high
- Status: Done
- Parent: None

## Acceptance criteria

- [ ] [unit] Center the enemy health bar across the unified combat status panel at desktop and narrow widths without changing combat state ownership or formulas.
- [ ] [unit] Relocate automatic attack cooldown/progress outside the unified status panel in a deliberate full-width slot near the action controls or damage log, with no overlap and preserved ARIA semantics.
- [ ] [integration] Preserve mute/audio, manual action controls, event log, canvas input, and existing HUD intents while rendering at 1280px, 390px, and 320px widths.
- [ ] [deployed] Verify the built application in a real browser at 1280px, 390px, and 320px with no HUD overlap, readable controls, and zero console errors.
- [ ] [persistence] No schema change; supported historical saves remain loadable and reloadable.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
