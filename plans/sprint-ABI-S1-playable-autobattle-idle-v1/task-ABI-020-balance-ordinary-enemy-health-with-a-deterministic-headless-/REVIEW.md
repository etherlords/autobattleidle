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

## Independent review — 2026-08-31 (BRIEF r14 / progress r59)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — health-candidate run stops applying its configured curve after every skipped boss

`simulateProgression({ bossCount: 0, ordinaryEncounters: 3000, ordinaryHealthGrowthRate })` skips each boss by constructing the following ordinary enemy directly, but the call at `src/domain/progression-simulator.ts:148` omits `ordinaryHealthGrowthRate`. The next enemy therefore uses the accepted linear production formula, while later spawns again use the candidate through `attack` (`src/domain/progression-simulator.ts:167-179`). This mixes baselines every 35th encounter and invalidates the 0.5% / 0.8% long-run wall comparison. Pass the active simulation option through that replacement and add a regression that crosses a skipped boss.

### P1 — required telemetry and strategy comparisons are not implemented or reproducible

The only exported aggregates are hits-only distributions by grade and a wall count (`src/domain/progression-simulator.ts:225-243`). There are no encounter-band, modifier/family, time-to-kill percentile, grade-transition, spike, boss-gap, or armor-cohort aggregates; `MEASURED-REPORT.json` is an untracked static file and has no generating/importing code. Nor do the options or production-path calls expose lower ordinary-reward, boss-cadence, critical-overflow, or penetration-overflow candidate strategies (`src/domain/progression-simulator.ts:49-55`, `src/domain/combat/progression.ts:37-90`). Thus the report's rejection/retention conclusions cannot be independently re-run from the shipped simulator, contrary to BRIEF.md:39-47. Implement the required explicit candidate inputs and deterministic report derivation, then test every acceptance cohort/strategy before recording a decision.

### P1 — tests prove existence, not the frozen acceptance envelopes or runtime evidence

The 3,000-encounter test checks only a count, `normal.p90 > 0`, and a non-negative wall count (`src/domain/combat.test.ts:508-517`); it never tests the candidate comparison, the two audited bands, TTK, 2x median jump, armor minimum-one transition, reward/Golden Bug accounting, strategies, or the roughly-two-second runtime target mandated by BRIEF.md:40-47. The current/load-save-reload test is valid supporting coverage (`src/persistence/persistence-boundary.test.ts:333-340`), and omitted growth does preserve production spawning, but it cannot establish the missing balance evidence. Add focused assertions over a generated deterministic report.

## Verification

- Focused: `pnpm exec vitest run src/domain/combat.test.ts src/persistence/persistence-boundary.test.ts` — PASS (35 tests).
- Full: `pnpm check` — PASS (160 tests, lint, format, Worker TypeScript, production build).
- `git diff --check` — PASS.
- Review scope excluded concurrent ABI-031 artifacts and `scripts/start-planner-ui.ps1`.

## Fresh independent review — 2026-08-31 (post-repair)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Candidate runs still do not preserve the declared ordinary-only curve through every production transition

`spawnEnemy` selects the grade before applying `ordinaryHealthGrowthRate`, then applies that growth unconditionally to the selected boss as well as ordinary grades (`src/domain/combat/progression.ts:45,52-76`). This invalidates the required ordinary-only candidate comparison and the unchanged-boss-health evidence. Separately, the simulator expires a Golden Bug with `expireGoldenBug(state)` (`src/domain/progression-simulator.ts:181-184`), whose replacement uses `spawnEnemy(..., 0)` without the rate (`src/domain/combat/progression.ts:131-137`), returning each automatic-only candidate run to the linear baseline after encounter 50. The repaired skip-boss path is correct at `src/domain/progression-simulator.ts:187-197`, but it is insufficient. Preserve the candidate only for ordinary simulation spawns across both skipped-boss and Golden-Bug-resume paths, and add cross-boundary regressions.

### P1 — The committed report is reproducible JSON, but it is not a derivation of the acceptance decisions or required telemetry

`buildMeasuredReport` only runs the current baseline and returns fixed decision strings (`src/domain/measured-report.ts:3-29`); it never invokes either 0.5% or 0.8% candidate, reward/cadence/chance/penetration alternative, or candidate-envelope decision. `Distribution` derives percentiles only from `hits` (`src/domain/progression-simulator.ts:102-117`), and `summarizeTelemetry` discards the calculated bands and returns no time-to-kill distributions, per-band results, family cohort, armor cohorts, grade transitions, or spikes (`src/domain/progression-simulator.ts:120-150`). Therefore the JSON equality test proves only that two fixed outputs agree, not that `MEASURED-REPORT.json` independently substantiates the required selection/rejection evidence.

### P2 — The report and canonical Vault still describe stale/planned state

The builder writes `briefRevision: 13` while the live task BRIEF is revision 14 (`src/domain/measured-report.ts:22`; `BRIEF.md` front matter). No related Vault article is changed in the current diff; their canonical sections remain `Planned ordinary-enemy health calibration` / `Planned ordinary-balance simulator` (AUTOBATTLEIDLE-DOC-20260827-A7FD1F lines 67-71; AUTOBATTLEIDLE-DOC-20260827-A798F2 lines 54-59), contrary to the explicit pre-closure acceptance requirement to record the accepted measured baseline.

## Fresh checks

- `pnpm vitest run src/domain/combat.test.ts src/persistence/persistence-boundary.test.ts` — PASS, 38 tests.
- `pnpm check` — PASS: lint, format, 163 tests, Worker TypeScript, production build.
- `git diff --check` — PASS.
- `planner_doctor` — healthy; no recovery required.

## Fresh independent review — 2026-08-31 (authorized second repair)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Candidate simulation loses its ordinary curve when a Golden Bug expires

`simulateProgression` resumes an expired Golden Bug with `expireGoldenBug(state)` at `src/domain/progression-simulator.ts:208-211`. That production helper restores the saved ordinary encounter through `spawnEnemy(resumeEncounter, 0)` without `ordinaryHealthGrowthRate` (`src/domain/combat/progression.ts:121-128`). In contrast, defeated Golden Bugs and skipped bosses now correctly propagate the candidate rate through `attack` and the skip path (`src/domain/combat/attacks.ts:101-113`, `src/domain/progression-simulator.ts:214-224`). A candidate run that exercises expiry therefore measures one linear ordinary encounter in the middle of the candidate curve, so it does not meet the required ordinary-only continuity across Golden Bug boundaries. Carry the simulator candidate through the expiry-resume seam and add an expiry boundary regression.

### P1 — The measured report still does not contain the required comparative evidence for the retained decisions

`buildMeasuredReport` computes detailed telemetry only for the two health candidates. The current linear baseline is reduced to `combinedWalls` and `automaticOnlyWalls` (`src/domain/measured-report.ts:3-22,48-50`), and cadence, lower ordinary reward/Golden Bug economy, critical overflow, and penetration overflow are fixed strings rather than runs, option inputs, or telemetry (`src/domain/measured-report.ts:48-51`; `SimulationOptions` at `src/domain/progression-simulator.ts:49-55`). `bossGaps` also merely reports the existing 35-encounter cadence, not a measured 50-150 candidate (`src/domain/measured-report.ts:24-28`). The JSON equality test proves determinism of that partial object but cannot substantiate the required current/0.5%/0.8% comparison or the economy/cadence/chance/penetration rejection decisions. Generate and persist named telemetry for each candidate/alternative, or explicitly narrow the accepted task contract before closure.

## Fresh checks

- `pnpm vitest run src/domain/combat.test.ts src/persistence/persistence-boundary.test.ts` — PASS, 39 tests.
- `pnpm check` — PASS: lint, formatting, 164 tests, Worker TypeScript, and production build.
- `git diff --check` — PASS.
- `planner_doctor` — healthy; no recovery required (one expected dirty-worktree warning).

## Review scope

Read live BRIEF r14, ABI-020 planner evidence, related Vault articles, the complete ABI-020 source/test/report diff, and production spawn/attack/purchase/Golden Bug/persistence paths. Concurrent ABI-031 artifacts and `scripts/start-planner-ui.ps1` were excluded. No product code was changed during review.

## Fresh independent review v5 — 2026-08-31 (BRIEF r19 / high-APS scope)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Fractional packets create combat state that current persistence rejects

`damageMultiplier` can leave fractional enemy health in `src/domain/combat/attacks.ts`, while current save validation accepts only safe integers. The controller regression proves packet execution but not high-APS tick -> encode -> decode. Use a persistence-safe representation and add the missing round-trip proof.

### P1 — Historical active Golden Bug saves use the wrong APS formula during recognition

`src/persistence/save/validation-v3.ts` reconstructs legacy Golden Bug HP with the new APS curve. Valid V3/V4 saves with nonzero automatic-speed levels can therefore be rejected. Retain the pre-ABI APS calculation only for legacy recognition and add nonzero-speed V3 and V4 load -> save -> reload fixtures.

### P1 — The measured progression does not reach the accepted 10-plus APS band

`MEASURED-REPORT.json` records automatic-speed levels 272 at 48h and 294 at 49h, which map to approximately 3.284 and 3.660 APS under the shipped curve; level 1,000 is still below 10 APS. Tune the measured curve/economy, report actual APS in each time band, and prove the declared 10-plus band.

### P1 — High-APS Golden Bug evidence bypasses production packet resolution

`src/domain/measured-report.ts` compares arithmetic totals rather than resolving production packets, independent critical rolls, transitions, reward, expiry, and resulting state. Generate automatic-only and manual-plus-automatic evidence through the production-domain packet path.

### P1 — Comparative report evidence remains incomplete

Only the two health candidates are actual runs, and those runs cover 300 rather than 3,000-plus ordinary encounters. Cadence, reward, critical, and penetration alternatives remain absent despite BRIEF r19. Emit named telemetry and accepted/rejected reasons for every retained alternative across the declared sample.

### P2 — Report metadata is stale

The builder and committed JSON record `briefRevision: 18`; active authority is BRIEF revision 19.

## Fresh checks

- Targeted checks: PASS, 55 tests.
- `pnpm check`: PASS, 169 tests plus lint, formatting, Worker TypeScript, and production build.
- `git diff --check`: PASS.
- Green checks do not cover the six findings above.

## Fresh independent review v6 — 2026-08-31 (BRIEF r19 / repair v6)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — The 48-hour simulator does not exercise the production high-APS packet path

The application controller resolves full and fractional automatic packets at the bounded visual cadence in `src/app/battle/controller.ts:142-169`. `runProgression` instead calls one ordinary automatic `attack()` per derived interval in `src/domain/progression-simulator.ts:280-350` and never supplies the production `automaticBatch` / `damageMultiplier` schedule. The report therefore does not prove packet rounding, independent critical sequence, reward/event ordering, Golden Bug behavior, elite slow handling, or exact/event-jump equivalence after APS exceeds the visual cadence. Route the oracle and event-jump model through one shared packet schedule and test representative high-APS boundaries.

### P1 — Required stage, economy, and boss telemetry is incomplete and reveals saturation

`realTimeBands` in `src/domain/measured-report.ts:209-221` omits the required p50/p90/max, one-/five-/ten-hit fractions, modifier and armor cohorts, boss TTK/cadence, reward source/spend/gap, and saturation accounting. The generated 48-hour and 49-hour receipts already reach `Number.MAX_SAFE_INTEGER` coins (`MEASURED-REPORT.json:1166,1206`), but the report neither records nor rejects that saturated economy. Complete the measured telemetry and tune or explicitly reject saturation before closure.

### P1 — The approximately-two-second fast-forward acceptance is not proven

The boundary regression at `src/domain/combat.test.ts:261-280` rounds only elapsed telemetry to 10 ms, has a 30-second timeout, and contains no runtime bound. The independent filtered run took 20.48 seconds for 1/24/48/49-hour comparisons. Add a warmed bounded benchmark assertion for the 48-hour event-jump run and retain exact combat-state comparisons at representative high-APS packet boundaries.

### P2 — `workspaceProject` filtering hides the active task

`planner_get_current({ workspaceProject: "autobattleidle" })` reports all tasks terminal while the canonical board/BRIEF show ABI-020 In Progress. Unfiltered `planner_get_current` and exact `planner_tasks_list(itemId="ABI-020")` return the correct active task, and `planner_doctor` reports no recovery requirement. Treat this as a Planner filtering defect; do not use the filtered result for gates or closure.

## Fresh checks

- Focused controller and persistence checks: PASS, 30 tests, 1.27 s.
- Deterministic report equality: PASS, 13.56 s test time.
- Exact/event-jump boundary: functionally PASS, 20.48 s.
- `git diff --check`: PASS.
- Full `pnpm check` was intentionally not rerun after the P1 findings.

## Review scope

Read active Planner artifacts, the related Vault articles, all ABI-020 source/tests/report paths, production controller/combat/persistence seams, and repository quality rules. Review was read-only and excluded unrelated ABI-031 and tooling changes.

## Fresh independent review v7 — 2026-08-31 (BRIEF r19 / repair v7)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Time-band simulations overshoot their requested horizons

`runProgression` checks the requested horizon only before entering an enemy loop (`src/domain/progression-simulator.ts:238`) and can continue scheduled combat past it inside that loop (`src/domain/progression-simulator.ts:280`). `src/domain/measured-report.ts:213` then labels the overshot result as the requested stage. The generated receipt records 1 h as 5,215,000 ms, 4 h as 17,201,353.791 ms, 8 h as 37,129,210.256 ms, 24 h as 86,480,057.878 ms, and 49 h as 176,401,106.195 ms. Only 48 h happens to land exactly. The equivalence regression compares the two engines but never asserts `elapsedMs === horizonMs`. Add an inner horizon boundary that preserves pending packet state without applying post-horizon combat, and assert every requested band exactly.

### P1 — Required per-stage telemetry remains incomplete

`realTimeBands` exports boss hit distribution but not boss TTK p50/p90/max or cadence contribution. Golden Bug data is aggregate count/hits/rewards. Economy omits double-reward income, spend by upgrade family, and unaffordable gaps. `summarizeTelemetry` contains ordinary cohorts and two fixed encounter bands, not the complete per-stage contract required by BRIEF r19. Preserve those counters in simulation receipts and emit them for each real-time band.

### P1 — Four alternatives still use a 100-encounter sample

Cadence, critical, penetration, and reward alternatives call `run(..., 100, ...)` in `src/domain/measured-report.ts:171`; only health candidates use 3,000. Run all declared alternatives over the required 3,000-plus evidence sample and keep the report/runtime deterministic.

## Fresh checks

- Focused combat/controller/persistence suite: PASS, 60 tests, 21.09 s.
- `git diff --check`: PASS.
- Full `pnpm check` was intentionally not rerun after the P1 findings.

## Review scope

Read BRIEF r19, review history, generated receipt, shared scheduler/controller, simulator/report, persistence, and focused tests. Review was read-only and excluded unrelated ABI-031 and tooling changes.

## Fresh independent review v8 — 2026-08-31 (BRIEF r19 / repair v8)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Required measured alternatives are absent

`SimulationOptions` lacks boss-cadence, damage-formula, and upgrade-cost inputs (`src/domain/progression-simulator.ts:58`). The report executes only two health curves plus cadence/critical/penetration/reward (`src/domain/measured-report.ts:161,177`), while `bossGaps` is only the fixed baseline interval. Add real measured boss, damage, APS, and upgrade-cost alternatives so every BRIEF r19 candidate family has an input, 3,000-plus run, telemetry, and accepted/rejected reason.

### P1 — Per-stage telemetry remains incomplete and cadence contribution is mislabeled

Grade/modifier distributions are hit-only; TTK exists only for two fixed encounter bands (`src/domain/progression-simulator.ts:150,177`). Armor omits effective armor, grade transitions and boss gaps are absent, and `cadenceContributionMs` sums the full elapsed time between boss completions (`src/domain/measured-report.ts:241`) rather than boss-only combat. Record per-stage hit and TTK distributions for every required cohort, raw/effective/prevented armor, transitions/gaps, and actual boss-only elapsed contribution.

### P1 — Exact/event-jump equivalence and runtime proof are too weak

The regression rounds timing fields and allows 30 seconds (`src/domain/combat.test.ts:261,280`); it does not compare exact final combat state or assert a warmed approximately-two-second event-jump. Strengthen the exact-state comparison at representative high-APS boundaries and add a bounded warmed 48-hour runtime assertion. The optimized whole-batch subtraction must be justified against the independently rolled packet sequence.

### P1 — High-APS Golden Bug receipt bypasses the shared scheduler

`src/domain/measured-report.ts:74,94` reconstructs packets and hardcodes `1_000 / 3` cadence rather than invoking `automaticPacketSchedule` / `resolveAutomaticPackets`. Route Golden evidence through the same scheduler and carry-over semantics used by production and the simulator.

## Fresh checks

- `git diff --check`: PASS.
- Focused Vitest attempts did not return a terminal result in the shared workspace.
- Full `pnpm check` was not rerun after the P1 findings.

## Review scope

Read BRIEF r19, v7 review, current ABI-020 source/tests/report, controller, and persistence. Review was read-only and excluded unrelated ABI-031 and tooling changes.

## Fresh independent review v9 — 2026-08-31 (BRIEF r19 / repair v9)

## Verdict

CHANGES_REQUIRED

## Findings

### P1 — Critical and armor-penetration alternatives do not change semantics

The current alternatives force `criticalRoll` or `armorPenetrationLevel` (`src/domain/progression-simulator.ts:69`, `src/domain/measured-report.ts:199`) but `attack()` still derives the same production asymptotic formulas (`src/domain/combat/attacks.ts:17,62`). Add explicit simulator-only critical and penetration formula policies that flow through the production attack operation, and compare those semantics against the current asymptotic policies across the required 3,000-plus sample.

### P1 — Golden Bug observations contaminate ordinary telemetry

`summarizeTelemetry` includes every non-boss observation (`src/domain/progression-simulator.ts:168`). Golden Bugs have grade `normal` and are separately tagged `goldenBug`, so ordinary grade/modifier/armor/wall and candidate distributions include timed-event encounters. Filter ordinary telemetry to non-boss and non-Golden observations while retaining a separate Golden group; add a regression over a sample containing Golden events.

## Fresh checks

- Planner doctor: healthy with expected dirty-worktree warning.
- Vault doctor: 15 articles, 0 errors or warnings.
- `git diff --check`: PASS.
- Tests were not rerun after the P1 findings.

## Review scope

Read active BRIEF r19, current ABI-020 simulator/report/attack/progression code, generated report, and Planner/Vault health. Review was read-only and excluded unrelated ABI-031 and tooling changes.

## Fresh independent review v10 — 2026-08-31 (BRIEF r19 / repair v10)

## Verdict

CHANGES_REQUIRED

## Finding

### P1 — Golden Bug still contaminates ordinary grade transitions

The simulator filters Golden observations before summarizing ordinary telemetry, but transition
collection compares each filtered observation with `report.observations[index]` from the unfiltered
array (`src/domain/progression-simulator.ts:210`). After a Golden Bug, the index points at the timed
event rather than the previous ordinary observation. Build transitions from adjacent entries in the
filtered ordinary sequence and add a Golden-boundary regression.

## Verified

- Critical and penetration alternatives change formula semantics through `attack` and each run 3,000 encounters.
- Ordinary cohorts, walls, and grade distributions exclude Golden Bugs; only transition adjacency remains incorrect.
- Exact horizons/state equivalence, high-APS batching, warmed 48-hour runtime, saves, report determinism, and Golden outcomes remain covered.
- `git diff --check`: PASS.
- `pnpm check`: PASS; 20 files and 178 tests, lint, format, Worker TypeScript, app TypeScript, and build.

## Review scope

Independent read-only review of BRIEF r19, current ABI-020 diff, generated report, tests, and prior findings. No product, Planner, Vault, Git, or dependency mutation.

## Fresh independent review v11 — 2026-08-31 (BRIEF r19 / repair v11)

## Verdict

APPROVE

No P0-P3 findings.

## Evidence

- Ordinary observations are filtered before adjacent grade transitions (`src/domain/progression-simulator.ts:178,210`); the regression crosses an actual Golden boundary (`src/domain/combat.test.ts:627`).
- Formula alternatives route through production `attack`; shared 3 Hz packet scheduling remains the controller/simulator owner.
- Exact 1/4/8/24/48/49-hour state equivalence and warmed 48-hour runtime below 2.5 seconds remain covered.
- V1 through V4 and current persistence compatibility remains covered.
- `pnpm check`: PASS; lint, format, 20 test files and 178 tests, Worker TypeScript, app TypeScript, and production build.
- `git diff --check`: PASS.

Vault publication remains a Manager-closure prerequisite, not a code-review blocker.
