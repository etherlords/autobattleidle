---
plannerFormat: 1
id: ABI-007
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007: Complete release QA, GitHub Pages proof, and project timeline

## Goal

Complete release QA, GitHub Pages proof, and project timeline

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] pnpm check passes from a clean dependency state
- [ ] A real browser run proves deployed manual click and keyboard attacks reduce HP immediately without changing the automatic cooldown
- [ ] A real browser run proves the automatic attack locked state, unlock, seconds-and-milliseconds countdown, progress-to-zero attack, cooldown restart, and automatic-only slow behavior
- [ ] The deployed large enemy HUD shows name, encounter level, grade, modifier, and a shrinking accessible current/max HP bar on desktop and narrow viewports
- [ ] The deployed bounded lower-right log reports kill rewards and remains stable without unbounded entries during a long-run scenario
- [ ] A real browser run proves upgrades, grades, bosses, persistence, malformed-save recovery, reset, responsive layout, and continued progression past multiple bosses
- [ ] The GitHub Pages build is playable without blocking console errors and its exact deployment receipt and public URL are recorded
- [ ] Planner evidence produces a user-facing visualization of project progress and gate outcomes

## Dependencies

- ABI-006

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7F881
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
