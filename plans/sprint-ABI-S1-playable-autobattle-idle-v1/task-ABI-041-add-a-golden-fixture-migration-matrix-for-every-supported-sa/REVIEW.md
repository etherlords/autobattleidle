---
plannerFormat: 1
id: ABI-041
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-041 review

## Verdict

CHANGES_REQUIRED — independent review v1.

## Findings

1. **P1 — incomplete canonical-state projection.** The matrix asserted only the encounter,
   five upgrade levels, and a health ratio. It could remain green after losing or changing enemy
   identity, grade, modifier, armor, reward, maximum health, player damage, critical chance, or
   double-reward chance. Strengthen every row to freeze the complete persisted semantic state.
2. **P1 — self-confirming closed manifest.** The manifest compared its own hard-coded names and
   parallel expectation count, without linking coverage to the production `SAVE_VERSION` contract.
   Adding a new current version could leave the matrix unchanged and green. Add explicit source
   version metadata and assert distinct supported-version coverage against the current contract.
3. **P2 — duplicated historical literals.** Encounter-2170 precedence/stale-write tests and the
   active-Golden normalization test still embedded copies of the new fixtures. Reuse the committed
   immutable JSON fixtures so corrections cannot drift between tests.

Evidence: `src/persistence/persistence-boundary.test.ts:38`, `:54`, `:180`, `:192`, `:242`,
`:292`, `:344`; `src/persistence/save/contracts.ts:3`; `src/persistence/save/validation-v3.ts:35`.

Read-only review ran `git diff --check` successfully and stopped before broader tests after proving
material acceptance failures. No repository, Planner, Vault, Git, or browser state was mutated by the
reviewer.

## Independent review v2

CHANGES_REQUIRED — one P2 remained after repair v1. The nonzero-speed active-Golden V3 payload at
`src/persistence/persistence-boundary.test.ts:474-503` was still constructed inline, stored under
`SAVE_V3_KEY`, and excluded from the immutable fixture manifest. Extract and matrix-track that
supported V3 shape. Focused persistence tests (21/21) and `git diff --check` passed; the reviewer made
no mutations. The full `pnpm check` attempt was host-terminated while Vitest was still running and was
therefore not claimed as evidence.

## Independent review v3

CHANGES_REQUIRED — P1. No focused test seeds valid V3, V2, unversioned legacy, and V1 slots
together and then corrupts each newer slot in sequence to prove strict
`V3 -> V2 -> legacy -> V1` precedence and fall-through. The matrix isolates one source per row;
existing mixed-slot tests cover only V3+legacy and legacy+V1, so a V2/V3 ordering regression could
remain green. Add one compact four-slot precedence/fall-through regression.

All other ABI-041 requirements passed review: seven immutable rows, complete canonical normalized
projections, `SAVE_VERSION` coverage, exact source retention, publish/reload, fault tests, and no
runtime/schema/formula/UI changes. Focused persistence tests (21/21) and `git diff --check` passed.
The reviewer made no mutations; host time limits prevented an independent full `pnpm check` result.

## Independent reviews v4-v6

- **v4 CHANGES_REQUIRED:** the four-slot test compared final values but did not preserve a complete
  raw/invalid/absent pre-load snapshot. Repair added exact before/after assertions for every historical
  key.
- **v5 CHANGES_REQUIRED:** final values alone could not prove that a historical key was never rewritten
  with identical bytes. Repair added a `setItem` write log and asserted `[SAVE_V4_KEY]` exactly.
- **v6 APPROVE:** every scenario snapshots V3/V2/legacy/V1 after mutation, records every `setItem`,
  asserts V4 is the sole write, and confirms all historical values remain raw, invalid, or absent exactly
  as before load. The reviewer found no regression in the seven-fixture matrix, full projections,
  `SAVE_VERSION` coverage, migration/reload, V4 startup, Restore, malformed fallback, write retry, or
  stale-pending cancellation.

Final evidence: focused persistence tests 22/22, full `pnpm check` 185/185, and `git diff --check`
passed. Review was read-only and made no source, Planner, Vault, Git, dependency, or browser mutation.
