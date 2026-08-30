---
plannerFormat: 1
id: ABI-027
artifact: brief
project: ABI
profile: high-assurance
revision: 8
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-027: Make Golden Bug rewards visibly valuable relative to encounter risk and progression costs

## Goal

Make Golden Bug rewards visibly valuable relative to encounter risk and progression costs

## Work item

- Type: bug
- Priority: high
- Status: Done

## Acceptance criteria

- [ ] A deterministic balance audit compares Golden Bug kill reward at representative early, mid, and late encounters against the same-stage ordinary reward, boss reward, time-to-kill, escape risk, and next relevant upgrade costs; the current low-value root cause is proven before changing constants.
- [ ] The selected reward curve is centralized with the existing reward/balance authority, has an explicit measurable rationale, and makes a successful Golden Bug kill visibly meaningful at every audited band without creating an infinite or dominant farming loop.
- [ ] Golden Bug escape still awards nothing, kill awards exactly once, double-reward behavior composes exactly once, and save/reload during an active Golden Bug cannot duplicate, lose, or reroll the earned reward.
- [ ] HUD and bounded reward-log feedback clearly distinguish the Golden Bug payout and display compact and accessible exact values without introducing a second currency or modal.
- [ ] Focused deterministic tests cover representative encounter bands, rounding boundaries, ordinary/boss comparisons, double reward, escape, kill-on-deadline ordering, repeated command protection, and active-event historical-save load/save/reload.
- [ ] Independent review validates the economy model and exploit boundaries; browser QA proves kill versus escape, visible payout significance, reload safety, desktop/narrow feedback, console/network health, and exact-SHA Pages behavior.

## Dependencies

- ABI-006
- ABI-010

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
