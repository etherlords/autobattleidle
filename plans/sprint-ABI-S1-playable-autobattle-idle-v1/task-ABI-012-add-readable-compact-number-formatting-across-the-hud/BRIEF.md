---
plannerFormat: 1
id: ABI-012
artifact: brief
project: ABI
profile: high-assurance
revision: 4
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-015
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-012: Add readable compact number formatting across the HUD

## Goal

Add readable compact number formatting across the HUD

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] Exact grouped integers remain visible through 9,999; compact notation begins at 10,000 and uses explicit K/M/B/T/Qa/Qi suffixes with at most three significant digits.
- [ ] Rounding promotes the suffix boundary correctly, including 999,950 -> 1M, and never renders 1000K, NaN, or Infinity.
- [ ] One shared src/ui formatter is used for current/max HP, damage, armor mitigation, rewards, coins, upgrade costs, and numeric combat-log values; timers remain on the existing duration formatter.
- [ ] Both coin-balance surfaces (the passive top HUD and the upgrades modal) and every upgrade PRICE line use the same compact formatter, while full exact values remain accessible.
- [ ] Health pairs format both operands consistently, including 1,000 / 3,000 and 900K / 1M, without changing domain or persistence values.
- [ ] Exact grouped values remain available through ARIA numeric attributes/accessibility names and title where appropriate.
- [ ] Focused tests cover documented thresholds, suffix promotion, Number.MAX_SAFE_INTEGER, invalid non-finite inputs, HP pairs, and regression against locale-dependent early compaction.
- [ ] Real-browser QA proves HP, both coin balances, two-line upgrade prices, rewards, logs, accessibility values, and no horizontal overflow at 390px and desktop widths.
- [ ] Canonical HUD Number Display Policy remains consistent with the implementation and no unrelated combat, timer, persistence, or ABI-007+ scope is added.

## Dependencies

- ABI-006
- ABI-008
- ABI-015
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260828-C8B5AA
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
