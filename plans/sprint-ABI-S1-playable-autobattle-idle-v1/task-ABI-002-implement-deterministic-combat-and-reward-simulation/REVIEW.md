---
plannerFormat: 1
id: ABI-002
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-001
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-002 review

## Verdict

PASS — approved after one bounded repair and fresh independent re-review.

## Findings

### P1 — automatic attacks bypass the required paid unlock

`CombatState` had no unlock/eligibility state and initialized `nextAutomaticAttackAtMs` to zero, so an
automatic command was accepted at time zero. The guard enforced only cooldown, while the first focused
test codified the invalid automatic kill. This violated Combat Loop lines 24-26 and Economy lines 25-31:
auto attack starts locked and begins only after its one-time unlock purchase.

Required bounded repair: model automatic eligibility in the domain, ignore pre-unlock automatic
commands, preserve manual behavior and post-unlock one-second cooldown, and test pre-unlock rejection
plus manual/automatic parity after unlock.

## Review attempt 1 receipts

- Reviewer: independent `autobattle_reviewer`.
- `pnpm vitest run src/domain/combat.test.ts`: 5/5 passed before repair; green tests did not cover the missing unlock invariant.
- `pnpm check`: passed before repair (lint, format, 6 tests, TypeScript, Vite build).
- Evidence: `src/domain/combat.ts`, `src/domain/combat.test.ts`, `src/domain/snapshot.ts`, `src/app/application.ts`.
- Vault: Combat Loop `AUTOBATTLEIDLE-DOC-20260827-584401`, Enemy Tiers `AUTOBATTLEIDLE-DOC-20260827-A7FD1F`, Economy `AUTOBATTLEIDLE-DOC-20260827-A798F2`.
- Elapsed: about 5 minutes — context/Vault 2 min; code/diff 1 min; checks 6.3 s; analysis/report 2 min.

## Repair review

### PASS — prior P1 fixed

- `CombatState.automaticUnlocked` explicitly gates automatic commands; pre-unlock automatic attacks are ignored.
- Manual attacks remain available before unlock.
- After unlock, manual and automatic inputs retain the shared attack path.
- The one-second automatic cooldown and early-command rejection are covered.
- No new P1-P3 regression or ABI-003+ scope expansion was found.

### Fresh receipts

- `pnpm vitest run src/domain/combat.test.ts`: 7/7 passed.
- `pnpm check`: passed — lint, format, 8 tests, TypeScript, Vite build.
- Read-only re-review elapsed: about 2 minutes — diff/source review 1 min; checks 6.0 s; reporting 1 min.
