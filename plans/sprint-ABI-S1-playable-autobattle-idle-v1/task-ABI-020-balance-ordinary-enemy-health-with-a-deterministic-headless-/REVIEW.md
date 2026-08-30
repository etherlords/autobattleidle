---
plannerFormat: 1
id: ABI-020
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-020 review

## Verdict

APPROVE_BLOCKER

## Findings

### P0 — frozen automatic-only reference makes the 60-second ordinary-wall criterion impossible at encounter 2

The frozen reference starts with automatic unlock and permits at most one affordable repeatable purchase after each defeated ordinary enemy (`IMPLEMENTATION-GUIDE.md:27`; `BRIEF.md:38`), while every ordinary enemy must have a time-to-kill no greater than 60 seconds (`BRIEF.md:44`).

Encounter 2 is veteran: `src/domain/combat/progression.ts:32` selects the second ordinary grade and `src/domain/combat/enemy-definitions.ts:21-24` applies 1.5x health. Current production health is 210 (`round(140 * 1.002) * 1.5`); either frozen candidate is 212 (`round(140 * 1.005) * 1.5` and `round(140 * 1.008) * 1.5`). The formula owner is `src/domain/combat/progression.ts:43-65`.

The initial state deals one damage (`src/domain/combat/upgrades.ts:54-61`) at 0.1 APS (`src/domain/combat/balance.ts:18`; `src/domain/combat/upgrades.ts:39-51`), so automatic interval is 10,000 ms (`src/domain/combat/upgrades.ts:95-97`). Unlock schedules the first hit after that interval (`src/domain/combat/upgrades.ts:224-234`). Encounter-2 TTK is therefore 2,100 seconds on current production balance and 2,120 seconds under either allowed candidate; a 60-second window permits six one-damage hits and would require damage at least 36 or 3.533 APS.

No pre-encounter-2 repeatable purchase is affordable. The reference starts with one coin and buys the one-coin unlock (`src/domain/progression-simulator.ts:41-51`); starter reward is one, while damage—the cheapest repeatable upgrade—costs two (`src/domain/combat/upgrades.ts:114`, `src/domain/combat/upgrades.ts:175-181`). A hypothetical first damage purchase would provide only 12 damage and still need 180 seconds for 212 HP.

An encounter-2 exception, bootstrap grant, changed starting damage/APS, multi-purchase policy, or manual-input reference would alter frozen semantics. The active Vault specifically confines the present early exception to encounter 1 and retains encounter 2+ balance (`.docs/knowledge/design/Enemy Tiers and Boss Cadence.md:51`). A product decision must either exempt/bootstrap the initial progression interval, authorize a new early-game exception/grant, or revise the automatic-only wall criterion before implementation can resume.

## Verification

- `git diff --exit-code -- src` passed: no failed candidate source or test edits are present.
- `pnpm check` passed lint, formatting, 14 test files / 89 tests, TypeScript build, and Vite build.
