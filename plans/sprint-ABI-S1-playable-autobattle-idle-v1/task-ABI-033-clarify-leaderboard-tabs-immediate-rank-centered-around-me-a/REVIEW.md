---
plannerFormat: 1
id: ABI-033
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-032
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-033 review

## Verdict

CHANGES_REQUIRED — first independent review found one response-order correctness defect and two
evidence/documentation gaps.

## Findings

- P1: `showLeaderboard` has no request generation guard. A slower response for a previous metric can
  render after a newer selection, while the dialog formats the rows using its current mutable mode.
  Ignore obsolete completions and cover reversed promise resolution.
- P2: the active Vault decision still states up to 100 rows above and below, while ABI-033 freezes an
  Around Me radius of ten. Update the canonical decision before closure.
- P2: Worker coverage proves only a middle Around Me window. Add first-rank and last-rank assertions
  for inclusion, contiguous ranks, and at most ten neighbors.

## Evidence

- Independent reviewer: `abi033-independent-review`.
- `pnpm check`: passed with 20 test files and 148 tests before repair.

## Fresh post-repair review

CHANGES_REQUIRED — the first repair fixed the original findings, but a fresh full review found one
remaining P1 lifecycle and selected-view race.

- Pending rename/reset completions can start a new Level/Top load after the player has selected
  Golden Bugs/Around Me, allowing the obsolete action to replace the current view.
- Rename/reset success and error completions can still report into a disposed HUD.
- Guard asynchronous action completions at both the lifecycle and selected-view boundary. Add deferred
  rename/reset regressions covering intervening tab selection and disposal.

Fresh evidence:

- Independent reviewer: `abi033-independent-review`.
- Original stale-load finding, Vault bounds, and first/last Around edge coverage are now correct.
- `pnpm check`: passed with 20 test files and 149 tests after the first repair.
- `git diff --check`: passed.

## Final review after user-approved busy-state repair

PASS — pending rename/reset now disables metric, view, name, and action controls while keeping close
available; controls restore in `finally`, and load/rename/reset completions cannot update a disposed HUD.
The full ABI-033 acceptance set remains satisfied.

Final evidence:

- Independent reviewer: `abi033-independent-review`.
- Deferred stale-response, pending-action, restoration, and disposal regressions passed.
- `pnpm check`: passed with 20 test files and 150 tests.
- `git diff --check`: passed.
