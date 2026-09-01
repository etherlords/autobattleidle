---
plannerFormat: 1
id: ABI-043
artifact: brief
project: ABI
profile: high-assurance
revision: 15
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-028
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-043: Restore meaningful boss durability after player-relative enemy health

## Goal

Restore meaningful boss durability after player-relative enemy health

## Work item

- Type: bug
- Priority: high
- Status: In QA

## Acceptance criteria

- [ ] Boss health uses a dedicated mathematically documented stage-aware durability target instead of collapsing to the current roughly-30-hit player-relative value at high progression.
- [ ] At the authentic encounter-2170 player state, the boss is materially tougher than ordinary enemies and restores a clearly boss-like health/TTK scale; final numeric targets come from measured manual, automatic, and combined combat rather than an arbitrary fixed multiplier.
- [ ] Fast-forward and exact simulation report boss TTK bands across starter, early, midgame, endgame-start, and endgame checkpoints; the endgame boundary remains approximately 48 hours of real unattended play and continued 49-hour progression is required, while the resulting encounter number is measurement output rather than a fixed acceptance target.
- [ ] Ordinary 1/5/10-hit bands, Golden Bug health/reward/window, rewards, armor, upgrade formulas, save schema, and historical migration semantics remain unchanged.
- [ ] Existing V4 and migrated V3 saves respawn/normalize the same encounter safely; focused formula, simulation, persistence, and exact-SHA deployed QA prove no reset or unwinnable wall.

## Dependencies

- ABI-020
- ABI-028
- ABI-040

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
