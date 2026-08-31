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
- Reuse `src/domain/progression-simulator.ts` and existing combat registries. No browser gameplay feature, visual redesign, new dependency, save-version bump, Golden Bug formula/identity change, offline progression, or speculative simulator framework.
- Fixed reference policy: automatic unlock first; after each defeated ordinary enemy attempt at most one affordable repeatable upgrade, rotating round-robin across damage, armor penetration, automatic speed, critical chance, and double reward; deterministic combat/reward rolls plus a fixed modifier-roll sequence covering armor and non-armor elite modifiers; bosses and authored variants reported separately.
- Health policy: derive ordinary and boss HP from the current reachable player damage at the production spawn boundary. Deterministic cohorts target approximately 1, 5, and 10+ effective hits; health/hardened elites may target 13-16, while bosses target roughly 20-40 and remain below the accepted Golden Bug hit budget. Golden Bug health remains unchanged.
- Stage policy: report Start 0-1h, Start+ 1-4h, End of Start 4-8h, Midgame 8-24h, Endgame Start 24-48h, and Endgame from 48h. Each stage must retain nonzero 1/5/10+ ordinary populations and no unexplained boss wall; reached encounter is telemetry, not a target.
- Timing policy: exact and event-jump modes must agree. The report includes all Golden Bug, ordinary, and boss time through 48 hours plus one bounded Endgame sample. Do not tune the retained Golden Bug formula, add offline progression, or build a million-encounter path that the accepted time-based goal no longer needs.
- Attack-speed policy: effective automatic speed remains useful through at least 10 APS, but presentation emits at most approximately three attack ticks per second. A tick resolves `effectiveAPS / visualTickRate` as zero or more full packets plus at most one proportional fractional packet. Each packet rolls critical independently; only the displayed damage numbers may be aggregated.
- Golden Bug policy: retain its manual-click health calibration and ten-second rule, measure automatic-only and manual-plus-automatic outcomes at 10-plus APS, and reject any health scaling that simply cancels the additional automatic throughput.

## Implementation sequence

1. Refine the existing simulator into an exact production oracle plus an event-jump mode; keep modules small and named only where responsibilities are real.
2. Thread current player state through the existing spawn/resume/save-validation paths and centralize the damage-relative ordinary/boss hit targets without touching Golden Bug health.
3. Add focused tests for exact/fast-forward equivalence, elapsed-time stage boundaries, encounter-2,000 reference values, cohort hit budgets, boss/Golden Bug separation, safe saturation, rollover, and bounded 48-hour-run CPU time.
4. Make repeatable purchases jump to the next displayed/gameplay quantum and debit the summed skipped-level cost once; rerun historical/current save load -> save -> reload proof.
5. Run `pnpm check`; independent Reviewer verifies architecture, math, evidence, and scope; independent QA reruns deterministic telemetry, runtime, saves, and exact acceptance mapping.
6. Add the smallest shared-domain automatic-packet calculation, integrate it at the existing automatic attack owner, aggregate only presentation output, and prove the 3.3/6/10-plus APS examples plus independent critical rolls.
7. Regenerate the measured report with high-APS Golden Bug outcomes, rerun `pnpm check`, and repeat the independent review and QA gates because the prior review scope is superseded.
8. Update the three balance Vault articles from planned to accepted measured behavior, record verification/closure, commit through the native hook, push main, and prove exact-SHA CI/Pages/public health.

## Verification matrix

- Unit: metric math, deterministic repeatability, exact/event-jump equality, damage-relative cohort/band envelopes, boss/Golden Bug separation, meaningful upgrade quanta, saturation/rollover, and bounded runtime.
- Unit: effective-to-visual packet conversion for fractional, integral, high, invalid, and saturated APS; independent deterministic critical rolls; exact total damage for the 3.3 APS and 6 APS examples.
- Integration: simulator calls production `spawnEnemy`/`attack`/`purchaseUpgrade`; one round-robin purchase attempt per ordinary defeat; fixed saves V1/V2/current load, derive, save, and reload without reset or schema drift.
- Independent review: no P0-P2, no duplicated combat engine, no hidden UI/Three.js dependency, formulas and report agree, and only measured decisions reach production.
- Independent QA: fresh deterministic run reaches the 48-hour Endgame boundary within the CPU-runtime bound, all required cohorts/metrics are present, repeated report is identical, the live-time receipt includes every timed event, and `pnpm check` passes.
- Independent QA: visible automatic attacks remain bounded near three ticks per second while combat throughput continues beyond 3 APS; simultaneous numbers are aggregated without losing packet damage, critical, armor, reward, or Golden Bug truth.
- Release: native pre-commit hook passes, pushed commit equals remote main, CI and Pages jobs succeed for that exact SHA, deployed URL returns HTTP 200, and final Planner/Vault/Git audit is clean with no lease or recovery journal.
