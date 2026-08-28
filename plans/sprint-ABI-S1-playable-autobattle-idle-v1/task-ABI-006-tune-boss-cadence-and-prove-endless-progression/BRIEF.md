---
plannerFormat: 1
id: ABI-006
artifact: brief
project: ABI
profile: high-assurance
revision: 12
status: Ready for Manager
sprintId: ABI-S1
dependencies:
  - ABI-003
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-006: Tune endless upgrade curves, armor penetration, and boss progression

## Goal

Tune boss cadence and prove endless progression

## Work item

- Type: task
- Priority: high
- Status: Ready for Manager

## Acceptance criteria

- [ ] A deterministic simulator reports elapsed time, purchases, attack counts, armor mitigation, penetration, coins, encounters, and several bosses
- [ ] Damage, armor penetration, critical, double-reward, and automatic-speed levels remain indefinitely purchasable with diminishing but measurable effects; only automatic unlock is one-time
- [ ] Armor penetration uses one bounded shared formula, preserves minimum hit damage, and keeps armored elites and bosses beatable through measured investment
- [ ] The first unattended boss target is approximately ten minutes, later targets increase, and the reference strategy cannot exhaust all meaningful choices before the first boss
- [ ] Runtime and simulator consume the same centralized enemy, boss, reward, upgrade-cost, diminishing-return, and penetration constants/formulas
- [ ] High-level and multi-boss samples remain deterministic and finite without Infinity, NaN, negative costs, zero-cost loops, terminal upgrade caps, or stalled progression
- [ ] Exact constants, curve rationale, simulator reports and supported numeric limits are documented in Vault and protected by focused tests
- [ ] pnpm check, independent review, browser QA, CI/Pages and deployed multi-boss/upgrade/armor proof pass

## Dependencies

- ABI-003
- ABI-004
- ABI-005

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-584401

## Constraints

- Follow the resolved workflow contract and project instructions.
