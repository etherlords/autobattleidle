---
plannerFormat: 1
id: ABI-020
artifact: analysis
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

# ABI-020 analysis

## Verified current state

- Fresh 2026-08-29 audit: dependencies ABI-010, ABI-016, ABI-018, and ABI-022 are Done; Planner selected ABI-020 as the unique highest-priority dependency-ready task and the root manager holds the only live lease.
- `src/domain/progression-simulator.ts` already drives the production `attack`, `createCombatState`, `expireGoldenBug`, and `purchaseUpgrade` paths, but it stops after three bosses and reports only aggregate purchases, time, attacks, armor prevention, and penetration. It does not satisfy the 3,000-ordinary encounter, cohort, percentile, wall, candidate, or strategy telemetry contract.
- `spawnEnemy` currently uses linear ordinary base health `round(140 * (1 + 0.002 * (encounter - 1)))`, reward `round(1.2 * encounter * tier multiplier)`, a fixed 35-encounter boss interval, unchanged polynomial boss multipliers, and armor `2 * encounter` for the armor modifier.
- Critical chance and armor penetration already use bounded asymptotic formulas. ABI-020 will measure explicit overflow alternatives but will not adopt either alternative without telemetry and a named product decision.
- Vault authority: Enemy Tiers and Boss Cadence requires 0.5% versus 0.8% exponential ordinary-health candidates, 3,000+ ordinary encounters, separate bosses/families/modifiers, and unchanged boss multipliers; Economy and Upgrade Curves requires production-path round-robin one-purchase-per-defeat telemetry; Combat Loop and Code Quality keep domain simulation pure and deterministic.
- Persistence impact: **no schema change**. Production state fields and save DTOs remain unchanged. Verification must load/reload current plus supported V1/V2 fixtures and prove derived enemies remain accepted through the existing migrations/validators.

## Approach

- Extend the existing simulator rather than add a second engine. Give it a small configuration for ordinary health/reward/cadence and chance/penetration strategy evaluation, deterministic roll sequences, encounter target, and runtime clock.
- Report deterministic per-encounter observations, then derive named cohort/band metrics: hits/time-to-kill p50/p90/max, one-hit/5-plus/10-plus fractions, upgrade levels, bosses/gaps, rewards, armor raw/effective/prevented/minimum-damage fractions, authored modifier cohorts, and walls/spikes.
- Compare 0.5% first against 0.8%; reject a candidate on the frozen acceptance envelopes. Measure boss cadence and lower ordinary rewards without changing boss health multipliers. Compare asymptotic and overflow semantics separately; keep asymptotic production behavior unless evidence plus explicit product decision supports a change.
- Apply only telemetry-supported constants/formulas at their current owners (`balance.ts`, progression/tier/modifier formulas, upgrade formulas). Preserve safe saturation, deterministic rollover, event ordering, Golden Bug rules, and all presentation contracts.
- Acceptance layers: simulator/metrics/formulas are **unit**; production attack/purchase/spawn plus save fixture round-trips are **integration**; exact-SHA CI and Pages/public smoke are **deployed supporting proof** because ABI-020 has no new UI interaction.

## Risks

- A simulator that duplicates formulas can go green while production remains wrong; every run must call production transitions and tests must prove that route.
- Exponential growth and 3,000+ encounters can overflow or create impractical loops; formulas saturate safely and simulation has explicit encounter/attack/runtime bounds.
- Aggregate percentiles can hide grade/modifier or armor failures; cohort and band results are mandatory, especially early/mid/1000+ armored encounters.
- Changing derived enemy formulas can invalidate historical saves even without a DTO change; retain version-specific validation/migration semantics and prove load -> save -> reload.
- Boss and Golden Bug economy can distort ordinary telemetry; report them separately and do not change boss health multipliers or Golden Bug reward identity.
