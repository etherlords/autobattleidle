---
plannerFormat: 1
id: ABI-018
artifact: brief
project: ABI
profile: high-assurance
revision: 11
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018: Show current upgrade stats and rebalance automatic attack speed

## Goal

Show current upgrade stats and rebalance automatic attack speed

## Work item

- Type: task
- Priority: high
- Status: Done

## Acceptance criteria

- [ ] The upgrades dialog shows a compact aria-readable current-stats panel for damage, armor penetration percent, critical chance percent, double-reward chance percent, and automatic attacks per second, using existing spare modal space without redesign.
- [ ] Automatic attack speed uses APS(level) = 0.1 + 2.9 * level^2 / (level^2 + 150^2), with intervalMs = 1000 / APS: level 0 is 0.1 APS, level 100 is approximately 1 APS, level 200 is approximately 2 APS, values are finite and strictly increasing, and the 3 APS cap is approached but never reached.
- [ ] The HUD reports automatic speed in attacks per second clearly enough to expose each upgrade's effect; the automatic cooldown display and elite automatic-slow modifier remain semantically correct.
- [ ] Armor penetration retains its current asymptotic 0.75 * level / (level + 20) formula and critical chance retains 0.6 * level / (level + 20); both are displayed as percentages and never mathematically reach their caps.
- [ ] Double-reward chance is displayed as a percentage but its current formula and reward economy remain unchanged; changing or summarizing reward behavior requires a separate product decision.
- [ ] The change has no save-schema change and preserves deterministic attack rolls, historical-save load/save/reload, exact per-level upgrade costs, safe-number behavior, and non-automatic combat semantics.
- [ ] Focused tests cover levels 0, 1, 10, 50, 100, 200, 500, and 1000, monotonicity/asymptotic bounds, snapshot-to-HUD stat values, automatic-slow interaction, historical saves, and deterministic progression.
- [ ] ABI-014 starter behavior and the existing boss/progression timing are re-evaluated against the slower early automation; ABI-016 remains camera-only. Independent review, desktop/390px browser QA, pnpm check, and exact-SHA Pages proof pass.

## Dependencies

- ABI-015
- ABI-017
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260828-ECBD82
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
