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
- Published commit: `a43aaaf9975b1e5ac67dd7272acaf690a73b08a0`.
- Exact-SHA CI run `33327609427` and Pages run `33327609426` completed successfully.
- Public URL `https://etherlords.github.io/autobattleidle/` returned 200 and loaded
  `assets/index-BrZSuSWD.js` with SHA-256
  `84e4537973234510aea2c1b968185e98bf80e6c7b2b91ee104db7430709dbc2e`.
- Isolated public proof loaded a literal active legacy V3 reward of 1,220 with 77 coins, issued one
  stationary battlefield click, observed `Golden Bug reward: +6,100 coins`, persisted 6,177 coins,
  cleared the event, resumed encounter 51, and recorded zero console or failed-request problems.

## Sign-off

- Reviewer: PASS — `evt-7d20d81c-138e-4409-b3c1-51c9aeb78573`
- QA: PASS — `evt-301751ec-ff31-4252-87e1-89e7438d2114`
- Manager close: PASS — exact-SHA CI, Pages, asset identity, and public behavior proven
