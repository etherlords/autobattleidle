---
plannerFormat: 1
id: ABI-020
artifact: implementation_guide
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

# ABI-020 implementation-guide

## Frozen scope

- Exactly ABI-020: deterministic production-path balance simulator, measured selection of ordinary health/cadence/reward/armor tuning, explicit chance/penetration alternatives, focused tests, save compatibility, Vault sync, independent gates, and release proof.
- Reuse `src/domain/progression-simulator.ts` and existing combat registries. No browser gameplay feature, visual redesign, new dependency, save-version bump, boss-health multiplier change, Golden Bug identity change, or speculative simulator framework.
- Fixed reference policy: automatic unlock first; after each defeated ordinary enemy attempt at most one affordable repeatable upgrade, rotating round-robin across damage, armor penetration, automatic speed, critical chance, and double reward; deterministic combat/reward/modifier rolls; bosses and authored variants reported separately.
- Candidate policy: compare ordinary exponential health 0.5% and 0.8%, lead with 0.5%, exclude 1.0%; keep boss multipliers fixed; accept cadence only within 50-150; compare a lower ordinary reward candidate against Golden Bug economy; measure asymptotic versus explicit-overflow chance and penetration separately.
- Frozen envelopes: bands 100-150 and 1000-1100 each retain >=5% one-hit, >=20% five-plus-hit, >=5% ten-plus-hit ordinary cases; veteran and elite have nonzero ten-plus cases; adjacent median hits-to-kill <=2x; finite ordinary TTK <=60s; early armored encounters are not dominated by minimum-one damage; late armor prevents a measurable nonzero share.

## Implementation sequence

1. Refine the existing simulator into configurable production-path runs and deterministic observation/metric helpers; keep modules small and named only where responsibilities are real.
2. Add focused tests for reference values, fixed-run repeatability, one purchase per ordinary defeat, 3,000+ ordinary encounters, cohort separation, percentiles, boss gaps, Golden Bug reward accounting, armor envelopes, candidate formulas, safe saturation, rollover, and runtime.
3. Run both health candidates plus cadence/reward/chance/penetration/armor alternatives; retain a machine-readable measured report and choose only candidates meeting the frozen envelopes.
4. Apply the accepted minimum balance diff at current formula owners; rerun focused tests and historical/current save load -> save -> reload proof.
5. Run `pnpm check`; independent Reviewer verifies architecture, math, evidence, and scope; independent QA reruns deterministic telemetry, runtime, saves, and exact acceptance mapping.
6. Update the three balance Vault articles from planned to accepted measured behavior, record verification/closure, commit through the native hook, push main, and prove exact-SHA CI/Pages/public health.

## Verification matrix

- Unit: metric math, deterministic repeatability, 0.5/0.8 calculated references, cohort/band envelopes, boss gaps/multipliers, reward accounting, chance/penetration alternatives, armor transition, saturation/rollover, and bounded runtime.
- Integration: simulator calls production `spawnEnemy`/`attack`/`purchaseUpgrade`; one round-robin purchase attempt per ordinary defeat; fixed saves V1/V2/current load, derive, save, and reload without reset or schema drift.
- Independent review: no P0-P2, no duplicated combat engine, no hidden UI/Three.js dependency, formulas and report agree, and only measured decisions reach production.
- Independent QA: fresh deterministic run reaches >=3,000 ordinary encounters, all required cohorts/metrics are present, repeated report is identical, runtime target is approximately two seconds, and `pnpm check` passes.
- Release: native pre-commit hook passes, pushed commit equals remote main, CI and Pages jobs succeed for that exact SHA, deployed URL returns HTTP 200, and final Planner/Vault/Git audit is clean with no lease or recovery journal.
