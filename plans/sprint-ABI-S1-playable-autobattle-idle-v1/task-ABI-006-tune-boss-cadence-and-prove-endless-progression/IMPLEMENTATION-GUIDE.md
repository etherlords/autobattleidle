---
plannerFormat: 1
id: ABI-006
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
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

# ABI-006 implementation-guide

## Frozen scope

- ABI-006 only: deterministic progression simulator; centralized endless enemy/boss/reward/upgrade formulas; armor penetration; measured first/later boss targets; finite multi-boss evidence; persistence/runtime/HUD wiring required by those contracts; canonical balance Vault updates.
- Preserve minimum damage, deterministic command transitions, numeric safety, existing persistence failure handling, immutable battlefield snapshots, and all ABI-008..011 planning/Vault work.
- Exclude ABI-007 release summary and ABI-008+ UI redesign, enemy-art expansion, timed events, and combat-effect implementation.

## Implementation sequence

1. Introduce the smallest named balance helpers/types in `src/domain`, reusing `attack`, `spawnEnemy`, `purchaseUpgrade`, and `automaticInterval` as the single runtime path.
2. Add penetration and endless diminishing effects/costs; remove finite repeatable caps while retaining one-time automatic unlock and safe validation.
3. Add a deterministic finite simulator that drives the same commands/purchases and emits a typed report; tune constants from its reference strategy to the Vault timing envelope.
4. Update persistence boundary/version handling and snapshots/HUD only as required to store and expose the new domain state; keep Three.js presentation snapshot-only.
5. Add focused formula, high-level numeric, simulator determinism, multi-boss, application, and persistence regression checks; generate reproducible report evidence and run `pnpm check`.
6. Update the two balance Vault articles (and Combat Loop only if its shared formula contract changed materially) through optimistic-locking Vault tools with exact constants, reports, supported range, and code/test links.

## Verification matrix

- Unit: shared enemy/boss/reward/cost/effect/penetration formulas; minimum damage; monotonic finite supported range; endless level availability; deterministic identical simulator reports; increasing boss times and multi-boss completion.
- Integration: application exposes and purchases penetration/repeatable upgrades through the existing HUD contract; runtime attack uses shared formulas; persistence round-trips new state and safely handles old/malformed data; battlefield remains a pure snapshot consumer.
- Deployed: public Pages loads cleanly; real browser proves an upgrade purchase changes capability, armor reduces damage and penetration improves it, and bounded deterministic browser automation reaches several bosses with increasing target evidence and no console errors or persistence regression.
