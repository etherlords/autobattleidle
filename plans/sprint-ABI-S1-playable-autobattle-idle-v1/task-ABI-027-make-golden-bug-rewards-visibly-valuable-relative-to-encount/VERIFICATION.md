---
plannerFormat: 1
id: ABI-027
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-027 verification

## Acceptance evidence

- Golden Bug reward is centralized at 50x the resumed ordinary reward; the existing double-reward roll
  applies exactly once, while escape remains zero and stale enemy IDs remain ignored.
- Compact combat feedback identifies Golden payouts and includes the exact amount when abbreviation is used.
- Exact legacy active V3 10x rewards normalize to current 50x without resetting unrelated progress;
  arbitrary altered rewards remain invalid. No save schema changed.
- Representative legal bands 51/101/1001 cover ordinary reward, nearest boss, purchasable next upgrade,
  and timed automatic-escape/manual-kill boundaries.
- Independent review PASS; independent browser QA PASS; Vault doctor found 0 errors and 0 warnings.
- Manager `pnpm check`: 126/126 tests plus lint, format, TypeScript, and build PASS; `git diff --check` PASS.
- Exact published commit, CI, Pages, asset identity, and public functional proof are appended after push.

## Sign-off

- Reviewer: PASS — `evt-7d20d81c-138e-4409-b3c1-51c9aeb78573`
- QA: PASS — `evt-301751ec-ff31-4252-87e1-89e7438d2114`
- Manager close: pending exact-SHA publication proof
