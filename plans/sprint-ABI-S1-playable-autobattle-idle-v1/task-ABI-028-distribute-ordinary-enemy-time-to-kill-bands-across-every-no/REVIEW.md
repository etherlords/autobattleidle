---
plannerFormat: 1
id: ABI-028
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-028 review

## Verdict

APPROVE — independent review v4.

## Findings

1. **P1 — manual-only receipt returns a non-finite combat state.**
   `automaticEnabled: false` stores `Infinity` in `CombatState.nextAutomaticAttackAtMs`, while the
   public progression report promises a final production state. Keep automatic suppression in the
   simulator scheduler, return a finite state, and regress that manual-only neither unlocks nor buys
   automatic upgrades.
2. **P1 — the receipt stops before the accepted endgame boundary.**
   Buckets `1–99`, `100–499`, `500–999`, and `1000+` over only 3,000 encounters do not prove the
   frozen 48-hour boundary around encounter 24,920 or the full requested progression stages. Define
   the stage contract once, measure every specified boundary, and assert boundary membership.

## Evidence

- No-retune decision, ordinary-only filtering, boss/Golden/reward isolation, persistence classification,
  and reuse of isolated save injection for deployed QA are accepted.
- `pnpm vitest run src/domain/combat.test.ts --reporter=verbose`: 35/35 passed.
- Full `pnpm check` was not rerun because the two P1 findings block approval.
- Review was read-only; no code, Planner lifecycle, Vault, Git, or dependency mutation.

## Independent review v2

### Findings

1. **P1 — staged TTK classifies physical high-APS packets as logical attacks.**
   Fractional automatic packets are each counted as one `hits` event, so staged one-hit, five-hit,
   and ten-hit fractions do not prove the requested player-facing TTK bands. Add a named effective
   attack-unit metric, keep packet/event counts separate, and classify stages by logical units.
2. **P1 — manual-only and combined receipts stop before endgame.**
   Their 3,000-encounter runs assert only through midgame. Both modes must produce measured
   `endgameStart` and open-ended `endgame` evidence without adding a duplicate combat engine.

### Verified repairs and evidence

- Review v1 finite-state/manual-only scheduling finding is fixed.
- The stage contract is boundary-complete and open-ended from encounter 24,920; the 49-hour automatic
  receipt reaches encounter 30,234.
- Ordinary filtering excludes bosses and Golden Bugs; production HP, rewards, persistence, and boss/
  Golden formulas are unchanged.
- Focused combat: 36/36 passed; persistence: 18/18 passed; `git diff --check` passed.
- Full `pnpm check` had no terminal receipt in this review and is not claimed.

## Independent review v3

### Finding

1. **P1 — the endgame manual/combined probe uses the pre-boss player snapshot.**
   Endgame begins at encounter 24,920, which is a boss. The bounded probe skips that boss after
   seeding its player state, so encounter 24,921 misses the real boss reward and following purchase.
   Capture and start from the first actual ordinary, non-Golden encounter in each stage; explicitly
   regress endgame encounter 24,921 after the production boss transition.

### Verified evidence

- Logical attack units, fractional packets, event-jump accumulation, and mid-batch spill attribution
  are correct and covered by whole-report exact/event-jump equality.
- Ordinary summaries exclude bosses and Golden Bugs; production HP, boss, Golden, reward, and save
  code remain unchanged.
- Focused combat: 37/37 passed; scoped `git diff --check` passed.
- Full `pnpm check` was not rerun after the P1 was found.

## Independent review v4

No P0–P3 findings.

- Endgame boundary 24,920 resolves to first ordinary encounter 24,921 after the real boss reward and
  normal purchase transition; manual/combined probes receive that unchanged production player.
- Logical attack units retain fractional packets, per-enemy spill attribution, and event-jump skipped
  batches; all six stages and automatic/manual/combined modes are covered.
- Exact/event-jump equality remains covered at 1/4/8/24/48/49 hours; manual-only state is finite and
  never unlocks or buys automatic attack speed.
- Scoped diff changes only the simulator and focused tests; production HP, boss, Golden Bug, reward,
  and persistence code are unchanged.
- Focused combat: 37/37 passed; full `pnpm check`: 20 files, 181/181 tests, lint, format, Worker
  TypeScript, and production build passed; `git diff --check` passed.
- Review was independent and read-only.
