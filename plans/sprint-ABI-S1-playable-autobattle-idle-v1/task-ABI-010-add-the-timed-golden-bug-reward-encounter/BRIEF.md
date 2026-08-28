---
plannerFormat: 1
id: ABI-010
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-010: Add the timed Golden Bug reward encounter

## Goal

Add the timed Golden Bug reward encounter

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] A deterministic rare Golden Bug encounter has an explicit spawn rule, ten-second target window, visible countdown, exactly-once kill, escape, reward, and return-to-progression transitions
- [ ] Pre-spawn health is derived from maximum automatic damage in the event window with a tuned 5x-10x candidate factor so automatic combat alone cannot kill it before timeout
- [ ] A measured manual-click envelope proves active clicking can defeat the same bug without changing the automatic cooldown
- [ ] Kill grants a tuned large 5x-10x candidate reward exactly once; timeout grants nothing and cannot stall or skip ordinary boss progression
- [ ] The enemy uses a dedicated compact body and metallic gold material with lighting highlights plus non-color-only event cues
- [ ] Golden Bug state is represented in canonical simulation/persistence without storing timers or presentation objects and reload behavior is explicitly defined
- [ ] Simulator/unit tests, real browser timing QA, bounded cleanup, pnpm check, review, CI/Pages and deployed functional proof pass

## Dependencies

- ABI-006
- ABI-008
- ABI-009

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
