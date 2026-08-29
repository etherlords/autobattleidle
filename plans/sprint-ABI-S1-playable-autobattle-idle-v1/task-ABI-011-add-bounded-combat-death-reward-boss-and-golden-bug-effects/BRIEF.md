---
plannerFormat: 1
id: ABI-011
artifact: brief
project: ABI
profile: high-assurance
revision: 14
status: Ready for Manager
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-011: Add bounded combat, death, reward, boss, and Golden Bug effects

## Goal

Add bounded combat, death, reward, boss, and Golden Bug effects

## Work item

- Type: task
- Priority: normal
- Status: Ready for Manager

## Acceptance criteria

- [ ] Ordinary hit, armored hit, critical hit, enemy death, coin reward, boss transition, Golden Bug kill, and Golden Bug escape each have a distinct readable bounded effect
- [ ] Boss death/spawn effects are stronger than ordinary transitions and Golden Bug effects retain metallic/event identity without relying only on color
- [ ] Armor and critical effects are triggered from presentation events but never alter damage, reward, cooldown, or progression state
- [ ] Coin reward feedback is visible near the defeated enemy and remains consistent with the bounded lower-right log
- [ ] Effect counts, geometry, materials, listeners and timers remain bounded and are deterministically disposed during long sessions and scene replacement
- [ ] Effects respect reduced-motion/accessibility requirements and remain readable on desktop and narrow viewports
- [ ] Focused event-to-effect/lifetime/cleanup tests, browser visual QA, pnpm check, independent review, CI/Pages and deployed proof pass

## Dependencies

- ABI-009
- ABI-010

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A7F881

## Constraints

- Follow the resolved workflow contract and project instructions.
