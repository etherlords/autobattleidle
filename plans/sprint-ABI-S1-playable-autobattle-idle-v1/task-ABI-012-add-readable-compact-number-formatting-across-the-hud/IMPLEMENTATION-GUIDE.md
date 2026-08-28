---
plannerFormat: 1
id: ABI-012
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-012 implementation-guide

## Frozen scope

- Implement ABI-012 only: shared UI number formatting, the current HUD/modal/presenter call sites, focused tests, accessibility, and browser/deployed proof.
- Preserve `COMBAT_BALANCE`, raw snapshots, save schemas/fixtures, timer formatting, purchase behavior, and all ABI-007+ behavior.
- Reuse existing HUD classes and presenter. No dependency, formatting service, factory, or framework.

## Implementation sequence

1. Add the smallest fixed-contract formatter and boundary tests, including invalid values and `Number.MAX_SAFE_INTEGER`.
2. Route BattleStatus HP/level/coins and UpgradeDialog coins/levels/costs/reasons through it while retaining exact accessible values.
3. Route attack damage/reward messages through the same formatter before EventLog rendering; do not parse strings.
4. Extend focused HUD/presenter tests and run `pnpm check`, including existing historical-save load/reload coverage.
5. Independent review, then desktop/390px browser QA, Vault consistency readback, exact-SHA CI/Pages, and deployed proof.

## Verification matrix

- Unit: 0, 999, 1,000, 9,999, 10,000, 10,049, 99,950, 100,000, 999,949, 999,950, 1,000,000, 1,234,567, max safe integer, NaN, and infinities.
- Integration: HP pairs, both coin surfaces, every price, exact ARIA/title values, compact damage/reward logs, unchanged timers, and v1/v2 save load-reload tests.
- Deployed: desktop and 390px HP/coins/prices/logs, accessibility inspection, no horizontal overflow, clean console, and exact published SHA.
