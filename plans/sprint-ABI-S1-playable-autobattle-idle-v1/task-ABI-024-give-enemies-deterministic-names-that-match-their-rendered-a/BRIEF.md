---
plannerFormat: 1
id: ABI-024
artifact: brief
project: ABI
profile: high-assurance
revision: 4
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-024: Give enemies deterministic names that match their rendered archetype

## Goal

Give enemies deterministic names that match their rendered archetype

## Work item

- Type: task
- Priority: normal
- Status: In QA

## Acceptance criteria

- [ ] Every ordinary enemy, authored modifier family, boss family, and Golden Bug displays a readable name derived from its actual rendered archetype instead of the shared Ash Wisp label
- [ ] The displayed name and Three.js body family use one deterministic presentation classification so reload-equivalent snapshots cannot show a name/body mismatch
- [ ] Grade identity remains readable without duplicating or erasing the archetype name, and Golden Bug keeps its dedicated identity
- [ ] Enemy naming is presentation-only, deterministic, and does not change combat state, rewards, progression, save schema, or historical-save compatibility
- [ ] Focused mapping/reload tests, desktop and 390px browser readability, pnpm check, independent review, independent QA, CI/Pages, and deployed proof pass

## Dependencies

- ABI-009
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
