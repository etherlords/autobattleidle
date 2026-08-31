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

- Fresh 2026-08-31 audit: dependencies ABI-010, ABI-016, ABI-018, and ABI-022 are Done; Planner selected ABI-020 as the unique highest-priority dependency-ready task and the root manager holds the only live lease.
- The 2026-08-31 product correction freezes Golden Bug health as the accepted calibration reference: about 900,000 HP against about 11,000 damage per click at encounter 2,000-plus feels correct. ABI-020 changes ordinary and boss health, not the Golden Bug formula.
- `src/domain/progression-simulator.ts` already drives the production `attack`, `createCombatState`, `expireGoldenBug`, and `purchaseUpgrade` paths, but it stops after three bosses and reports only aggregate purchases, time, attacks, armor prevention, and penetration. It does not satisfy the 3,000-ordinary encounter, cohort, percentile, wall, candidate, or strategy telemetry contract.
- `spawnEnemy` currently uses linear ordinary base health `round(140 * (1 + 0.002 * (encounter - 1)))`. At encounter 2,000 this is only 700 base HP, so every ordinary authored cohort remains a one-hit enemy against 11,000 damage. This is the reported defect.
- The existing quadratic boss multiplier fails in the opposite direction: encounter 2,000 is about 16.2 million HP, roughly 1,500 unarmored 11,000-damage hits and about eighteen Golden Bugs. Bosses must be recalibrated with ordinary enemies against the retained Golden Bug envelope.
- The product target is now elapsed-time based rather than encounter based. One million encounters is not a goal. Endgame begins at approximately 48 hours of fresh automatic progression; the encounter reached is measured output. Working stages are Start 0-1h, Start+ 1-4h, End of Start 4-8h, Midgame 8-24h, Endgame Start 24-48h, and Endgame from 48h.
- Critical chance and armor penetration already use bounded asymptotic formulas. ABI-020 will measure explicit overflow alternatives but will not adopt either alternative without telemetry and a named product decision.
- The 2026-08-31 APS correction separates combat throughput from presentation cadence. Effective automatic speed must remain useful to at least 10 APS, while visible attack ticks stay near three per second. Each visual tick applies `effectiveAPS / visualTickRate` full and fractional attack packets; for example, 3.3 APS at 3 Hz resolves one full packet plus a 0.1 packet, while 6 APS resolves two full packets.
- Critical chance resolves independently for every full or fractional packet using the existing deterministic roll contract. Fractional packets scale resolved damage, and presentation may aggregate simultaneous numbers without becoming a combat-state owner.
- Vault currently contains the superseded 0.5%/0.8% exponential candidate and fixed-boss-multiplier plan. The explicit product correction is newer authority; Vault is updated only after the corrected implementation passes review.
- Persistence impact: **no schema change**. Production state fields and save DTOs remain unchanged. Verification must load/reload current plus supported V1/V2 fixtures and prove derived enemies remain accepted through the existing migrations/validators.

## Approach

- Extend the existing simulator rather than add a second engine. Give it a small configuration for ordinary health/reward/cadence and chance/penetration strategy evaluation, deterministic roll sequences, encounter target, and runtime clock.
- Report deterministic per-encounter observations, then derive named cohort/band metrics: hits/time-to-kill p50/p90/max, one-hit/5-plus/10-plus fractions, upgrade levels, bosses/gaps, rewards, armor raw/effective/prevented/minimum-damage fractions, authored modifier cohorts, and walls/spikes.
- Replace encounter-only HP growth with one centralized safe-saturated health calculation driven by reachable player damage. Keep deterministic cohorts near 1, 5, and 10+ effective hits; keep durable elites above that and bosses below the retained Golden Bug hit budget. Pass the current player state through spawn/resume/validation so runtime, simulator, and save reconstruction use the same production formula.
- Add an event-jump fast-forward over the same production transitions and compare it against the exact oracle at sampled and temporal-boundary runs. Simulate the complete 48-hour horizon plus one bounded Endgame sample while retaining every Golden Bug and boss delay; do not add a speculative million-encounter or offline-progression system.
- Apply only telemetry-supported constants/formulas at their current owners (`balance.ts`, progression/tier/modifier formulas, upgrade formulas). Preserve safe saturation, deterministic rollover, event ordering, Golden Bug rules, and all presentation contracts.
- Reuse one pure domain batching helper at the automatic-attack boundary. Do not add a second scheduler or store visual cadence in saves. Exact and fast-forward simulation must consume the same effective packet contract, and Golden Bug telemetry must show both automatic-only and manual-plus-automatic results at 10-plus APS without scaling its health one-for-one to erase speed gains.
- Acceptance layers: simulator/metrics/formulas are **unit**; production attack/purchase/spawn plus save fixture round-trips are **integration**; exact-SHA CI and Pages/public smoke are **deployed supporting proof** because ABI-020 has no new UI interaction.

## Risks

- A simulator that duplicates formulas can go green while production remains wrong; every run must call production transitions and tests must prove that route.
- Damage-relative health and long elapsed-time runs can overflow or create impractical loops; formulas saturate safely and the event-jump simulation has explicit elapsed-time/runtime bounds.
- Aggregate percentiles can hide grade/modifier or armor failures; cohort and band results are mandatory, especially early/mid/1000+ armored encounters.
- Changing derived enemy formulas can invalidate historical saves even without a DTO change; retain version-specific validation/migration semantics and prove load -> save -> reload.
- Boss and Golden Bug economy can distort ordinary telemetry; report them separately, correct the boss health curve, and preserve Golden Bug health/reward identity.
- Independent critical rolls increase variance when several packets share one visual tick; deterministic packet order and aggregate presentation tests must prove that batching changes neither total combat truth nor event ordering.
