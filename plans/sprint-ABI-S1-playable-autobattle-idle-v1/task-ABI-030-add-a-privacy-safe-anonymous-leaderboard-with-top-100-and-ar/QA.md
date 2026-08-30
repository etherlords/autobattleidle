---
plannerFormat: 1
id: ABI-030
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-012
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-030 qa

## Verdict

PASS — independent deployed QA by `/root/abi030_independent_qa`.

## Evidence

- Public Pages: `https://etherlords.github.io/autobattleidle/`.
- Worker API: `https://autobattleidle-leaderboard.etherlords.workers.dev`.
- Identity creation returned 201; score submission 204; Top and Around Me 200; rename 200; delete 204.
- Top rendered 15 entries. A level-150 tie remained deterministic at ranks 3 and 4. Around Me showed the current player at rank 15.
- Twelve persistent `QA Vanguard` seed rows remained after the temporary test identity was deleted.
- Leaderboard identity storage stayed separate from unchanged `etherlords.autobattleidle.save.v3`.
- Desktop and 390 x 844 passed without horizontal clipping; console had 0 errors and 0 warnings.
