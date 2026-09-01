---
plannerFormat: 1
id: ABI-044
artifact: brief
project: ABI
profile: high-assurance
revision: 2
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-028
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-044: Prevent early armored enemies from becoming harder than adjacent bosses

## Goal

Prevent early armored enemies from becoming harder than adjacent bosses

## Work item

- Type: bug
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] A deterministic production-path fixture reproduces the reported early-game case near encounter 50 with roughly 20% armor penetration, including raw damage, effective armor, final damage, required manual hits, and adjacent boss comparison.
- [ ] An armored ordinary enemy in the early-game sample no longer collapses every hit to the 1-damage floor or require hundreds of clicks; its manual, automatic, and combined TTK remain inside the accepted ABI-028 durable-ordinary band and below the adjacent boss durability target.
- [ ] Armor and the player's effective penetration or resulting mitigation are readable in the existing combat UI and accessible text so the player can understand why damage is reduced.
- [ ] The smallest shared armor, penetration, grade, or encounter-composition owner is corrected without weakening ordinary HP variety, boss durability, Golden Bug behavior, rewards, or later-game progression.
- [ ] Deterministic regressions cover early boundaries, zero/partial/full penetration, finite safe values, historical V3/V4 load-reload, and exact/event-jump simulation equivalence; pnpm check runs them by default.
- [ ] Independent review and deployed QA verify representative armored enemies on desktop and narrow layouts, reload persistence, clean console/network, and exact-SHA Pages output.

## Dependencies

- ABI-018
- ABI-028

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
