---
plannerFormat: 1
id: ABI-057
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: In Progress
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

# ABI-057: Unify combat status panel across desktop and narrow HUD

## Goal

Unify combat status panel across desktop and narrow HUD

## Work item

- Type: task
- Priority: high
- Status: In Progress
- Parent: None

## Acceptance criteria

- [ ] [unit] Existing BattleSnapshot values render one unified read-only combat status panel with enemy/mob name, encounter, grade/modifier, health, coins, automatic APS/cooldown state, raw/effective armor, penetration, damage, and critical chance without recalculating combat formulas in the UI.
- [ ] [integration] Existing HUD composition absorbs the detached Encounter/Roadmap presentation into the unified panel, preserves actions/event log/mute/settings behavior, and renders roadmap/goals plus live audio state from existing snapshot/service seams.
- [ ] [integration] Supported historical saves load and reload with unchanged progression semantics; no CombatState, persistence codec, save version, or localStorage game-save schema change is introduced.
- [ ] [deployed] Browser smoke at 1280px, 390px, and 320px shows clear information hierarchy, no horizontal/page overflow, no overlap with actions/log/audio controls, and preserved battlefield input/combat behavior.

## Dependencies

- None

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260828-C8B5AA
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- ABI-DOC-20260903-60F3BF

## Constraints

- Follow the resolved workflow contract and project instructions.
