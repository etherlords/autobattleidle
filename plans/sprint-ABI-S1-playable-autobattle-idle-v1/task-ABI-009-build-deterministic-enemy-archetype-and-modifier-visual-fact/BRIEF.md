---
plannerFormat: 1
id: ABI-009
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
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

# ABI-009: Build deterministic enemy archetype and modifier visual factory

## Goal

Build deterministic enemy archetype and modifier visual factory

## Work item

- Type: task
- Priority: normal
- Status: Ready

## Acceptance criteria

- [ ] One snapshot-driven factory composes archetype body, grade or boss silhouette, modifier attachment, and seeded decorative variants without owning simulation state
- [ ] The catalog contains multiple recognizable base body families and dedicated boss bodies rather than one recolored primitive
- [ ] Armor, vitality, automatic slow, and wealth use distinct non-color-only attachments and motion cues; wealth has documented reward semantics before activation
- [ ] Each body family has several deterministic decorative variants such as horns, fins, orbitals, satellites, scars, or crowns that remain stable across reload
- [ ] Boss bodies retain modifier cues and are immediately recognizable at supported viewports
- [ ] Replacement and effect resources are bounded and deterministically disposed during long sessions
- [ ] Focused factory/seed/cleanup tests, visual browser evidence for every body and modifier, pnpm check, review, QA, CI/Pages and deployed proof pass

## Dependencies

- ABI-003

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A7F881

## Constraints

- Follow the resolved workflow contract and project instructions.
