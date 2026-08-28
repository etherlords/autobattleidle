---
plannerFormat: 1
id: ABI-004
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004: Implement HUD, click input, and upgrade economy

## Goal

Implement HUD, click input, and upgrade economy

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] The application composes live CombatState with the frame scheduler so deployed manual and unlocked automatic attacks visibly reduce enemy health and advance encounters
- [ ] A large top enemy HUD shows enemy name, encounter level, grade, modifier, and an accessible shrinking health bar with centered current/max units such as 1000/1000
- [ ] Before purchase the automatic attack is visibly locked; after unlock a labeled progress bar drains to zero with a seconds-and-milliseconds countdown, attacks exactly once at zero, and restarts for the next interval
- [ ] Pointer and keyboard activation execute exactly one immediate manual attack per activation, bypass the automatic scheduler, and never reset or alter its cooldown
- [ ] Grade +2 automatic slow changes only the automatic countdown and never reduces or delays manual attacks
- [ ] A bounded lower-right event log shows recent combat and economy feedback including coins granted for each kill without unbounded DOM growth
- [ ] All five upgrade paths enforce costs, prerequisites, caps, and disabled reasons
- [ ] Desktop and narrow layouts keep the HP HUD, automatic countdown, click target, reward log, and controls usable, readable, and accessible
- [ ] Focused integration tests and real browser QA prove HP changes, cooldown independence, exactly-once input, reward log updates, and clean disposal

## Dependencies

- ABI-002

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
