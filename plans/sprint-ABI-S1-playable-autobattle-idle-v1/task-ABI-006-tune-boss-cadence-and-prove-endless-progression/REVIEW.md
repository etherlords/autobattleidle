---
plannerFormat: 1
id: ABI-006
artifact: review
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

# ABI-006 review

## Verdict

CHANGES_REQUIRED — independent review run 1 found six P1 issues. QA is blocked until repair and a fresh independent review pass.

## Findings

1. **P1 — false simulator metrics.** `progression-simulator.ts` hard-codes `manualAttacks: 1` while issuing only automatic attacks, and labels summed effective armor as damage actually mitigated.
2. **P1 — repeatable effects plateau.** Critical/penetration reach exact floating-point ceilings and automatic speed levels 20, 21, and 1,000,000 all produce 200 ms, violating measurable repeatable effects over the claimed supported range.
3. **P1 — boss cadence misses the target.** Reproduced boss timestamps are 717,371 ms, 2,883,716 ms, and 11,869,922 ms; later gaps grow by about 36 and 166 minutes instead of roughly one minute. The test only asserts cumulative increase.
4. **P1 — persistence accepts inconsistent redundant state.** V2 can accept `damage: 2` with `damageLevel: 0`, while combat derives damage from the level. Persisted values must be canonical or cross-validated.
5. **P1 — encounter numeric safety is incomplete.** `spawnEnemy` accepts unbounded/non-finite encounter inputs that can produce unsafe armor/reward values; define and test a supported range.
6. **P1 — canonical Vault balance evidence is absent.** Exact constants, measured reports, rationale, and numeric limits are not yet recorded in the related active articles.

Checks passed: `pnpm lint`, `pnpm format:check`, `pnpm test` (11/11), and `git diff --check HEAD`. Reviewer made no mutations. Elapsed approximately 14 minutes.

## Run 2

### Verdict

CHANGES_REQUIRED — no P0; three P1 and one P2 repair set remain.

### Findings

1. **P1 — level 30 is a terminal cap.** Every repeatable upgrade becomes disabled, contradicting “indefinitely purchasable,” “only automatic unlock is one-time,” and “no terminal upgrade caps.” Numeric documentation cannot redefine frozen acceptance.
2. **P1 — encounter 100 stalls.** Defeating supported encounter 100 unconditionally tries to spawn 101, which throws `RangeError`.
3. **P1 — native Vault freshness is stale.** Canonical Markdown contains the new evidence, but the Reviewer process read old hashes/content and reported the three paths dirty with an EPERM freshness-state write failure. Fresh native read/index proof is required.
4. **P2 — boundary tests incomplete.** Protect critical, double reward, automatic speed, cap removal, encounter 100→101, and explicitly mismatched derived persistence values.

Reproduced repaired evidence: exact three-boss report matches local Markdown; all five 29→30 effects are positive; V2 tampered damage and V1 fallback are safe; runtime/HUD use the shared catalog. Read-only lint, format, 11 tests, and diff check pass. Elapsed approximately 12 minutes.

## Run 3

### Verdict

CHANGES_REQUIRED — no P0; three runtime P1 repairs plus fresh-process Vault verification remain.

### Findings

1. **P1 — fractional damage invalidates good saves.** Ordinary level-2 combat leaves fractional enemy health, while V2 persistence requires integer health; encode/decode falls back and loses valid progress.
2. **P1 — representation endpoint and currency safety.** The largest accepted encounter cannot advance, and reward plus existing coins can exceed safe-integer range. Combat must not crash or persist unsafe currency.
3. **P1 — valid high-level save can crash HUD.** Persistence accepts levels whose next cost is unrepresentable; snapshot rendering calls `upgradeCost` and throws instead of exposing a safe disabled reason or rejecting the save.
4. **Environment — long-lived Reviewer Vault cache.** Exact bodies were current but the Reviewer process reported old metadata/index freshness and EPERM. Manager fresh native status/read evidence was clean; require a newly spawned review process after repair.

Cleared: no low upgrade cap, high adjacent effects, encounter 100→101, truthful report/cadence, shared runtime/HUD, derived-field rejection, and centralized growth delta. Read-only lint, format, 12 tests, and diff check pass. Elapsed approximately 14 minutes.

## Run 4

### Verdict

CHANGES_REQUIRED — one P1 numeric-endpoint defect remains; all other run 1–3 findings are cleared.

### Finding

1. **P1 — maximum safe damage level is not safe or repeatable.** At `Number.MAX_SAFE_INTEGER`, derived damage is `9,007,200,203,803,648`, which is not a safe integer and therefore makes the resulting player invalid for V2 persistence. A damage purchase with maximum coins reports success, clamps the level unchanged, and consumes the coins. The shared endpoint must either remain representable with a measurable level/effect change or return a stable disabled result without spending currency.

Reproduced alongside passing evidence: exact deterministic three-boss report; integer ordinary-hit V2 round-trip; mismatched-derived fallback; five positive 999,999→1,000,000 deltas; saturated reward/currency; encounter 100→101 and maximum-encounter rollover; stale-command rejection; high-cost HUD safety; target boss cadence; `pnpm lint`, `pnpm format:check`, `pnpm test` (12/12), `git diff --check`; fresh native Vault hashes/status. Reviewer made no mutations. Elapsed approximately 20 minutes.

## Run 5

### Verdict

CHANGES_REQUIRED — run-4 endpoint repair passes; one adjacent P1 maximum-boss reward safety defect remains.

### Finding

1. **P1 — maximum supported boss reward is unsafe and unpersistable.** `spawnEnemy(3,002,399,751,580,320, 0)` is accepted but the cubic boss multiplier produces reward `1.1556904435507245e+59`, which is not a safe integer. Persistence rejects that live enemy. Saturate the shared reward result or establish a genuinely safe accepted encounter bound, and add a highest-boss persistence regression.

Cleared: `damageForLevel(Number.MAX_SAFE_INTEGER)` is safe, and a non-advancing purchase returns `Level cannot advance safely` with identical state and no coin spend. `pnpm test` (12/12), lint, format check, diff check, and fresh native Vault status/hashes pass. Reviewer made no mutations. Elapsed approximately 13 minutes.

## Run 6

### Verdict

CHANGES_REQUIRED — maximum-boss reward/persistence repair passes; one P1 final-step improvement defect remains across repeatable upgrades.

### Finding

1. **P1 — accepted final-level purchases can no-op or regress while consuming coins.** At `Number.MAX_SAFE_INTEGER - 1`, the next damage value is identical after saturation; critical, double reward, and penetration decrease slightly due floating-point precision; automatic interval increases. The exact-maximum guard therefore permits a maximum-cost purchase that violates the strictly improving repeatable contract. Disable any purchase whose next derived effect is not strictly better, return the original state without debit, and cover every repeatable upgrade at the representation boundary.

Cleared: highest accepted boss reward is a safe saturated integer and V2 round-trips it; fresh Planner/Vault state and hashes pass; `pnpm lint`, `pnpm format:check`, `pnpm test` (14/14), and `git diff --check` pass. Reviewer made no mutations. Elapsed approximately 14 minutes.

## Run 7

### Verdict

CHANGES_REQUIRED — representation-boundary repairs pass; one P1 simulator-strategy mismatch and one P2 report-regression gap remain.

### Findings

1. **P1 — simulator contradicts the canonical reference strategy.** The purchase loop buys every affordable upgrade after one defeat because it does not break, while Vault specifies exactly one affordable purchase per defeated enemy. The recorded report has 74 purchases for 45 defeated encounters and therefore cannot represent the documented strategy. Enforce one purchase, remeasure cadence, and update canonical evidence.
2. **P2 — deterministic report is not asserted exactly.** The test checks broad timing windows and run-to-run equality but not the documented timestamps, attacks, purchases, coins, mitigation, or penetration. Protect the corrected canonical report with one focused exact assertion.

Cleared: all five practical/million-level repeatable upgrades improve; every non-improving representation-boundary purchase is blocked without spending; boss reward/persistence endpoints pass; `pnpm check` (14/14), Planner doctor, Vault freshness/hashes, and diff check pass. Reviewer made no mutations. Elapsed approximately 15 minutes.

## Run 8

### Verdict

APPROVE — no P0–P2 findings remain.

### Evidence

- Simulator purchases only after a defeated enemy and exits after one successful purchase; the exact report and 44 repeatable purchases for 45 defeats are asserted.
- Shared boss formula `10 + 120*i + 5*i^2` produces the documented 596,085.714 / 1,296,381.366 / 2,135,163.975 ms boss arrivals with increasing intervals.
- Safe capped encounters/rewards, rollover, all-repeatable no-spend endpoint guard, and V2 cross-validation remain intact.
- Native Vault is fresh with hashes A7FD1F `5359568e...`, A798F2 `c2d64897...`, and 584401 `1d0ea54c...`; no dirty/failed/pending paths.
- `pnpm check` passes lint, format, 14 tests, TypeScript, and production build; `git diff --check` passes. No ABI-007+ implementation or `.playwright-cli` inclusion observed.

Independent Reviewer made no mutations. Elapsed approximately 8 minutes.
