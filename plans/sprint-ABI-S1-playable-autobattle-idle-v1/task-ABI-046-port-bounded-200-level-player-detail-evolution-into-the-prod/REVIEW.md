---
plannerFormat: 1
id: ABI-046
artifact: review
project: ABI
profile: high-assurance
revision: 3
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-038
  - ABI-045
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-046 review

## Verdict

APPROVE — no remaining P0–P3 findings after one bounded repair cycle.

## Findings

### P1 — outgoing attacks trigger player recoil

`src/game/battlefield/lifecycle.ts` routes each outbound `BattleAttackVisualCue` to both player `hit`
and `attack`. These cues describe damage to the enemy, so the player must receive only `attack`;
otherwise high APS continuously resets an eight-frame recoil animation.

Required repair: remove player-hit routing and add manual plus automatic/high-APS attack-only coverage.

Resolution: fixed. Structured outbound cues now dispatch only `attack`; manual and automatic 11 APS /
three-packet regression verifies attack motion with neutral recoil scale.

### P2 — historical persistence test skips production rendering

The V1–V4 regression proves decode/encode identity but does not render through the production
`BattleSnapshot -> Battlefield -> PlayerUnit` path. A broken level-to-visual connection would pass.

Required repair: render every historical fixture before and after save/reload, compare the canvas
form/detail receipt, and confirm no visual identity field is persisted.

Resolution: fixed. V1–V4 fixtures now cross production Battlefield rendering before and after
encode/reload, retain identical form/detail receipts, and persist no visual field.

## Evidence

- Focused Vitest: 4 files, 43 tests passed.
- `git diff --check`: passed.
- Positive checks: finite 2000 boundary, finite high-level catalogue, production ownership, disposal,
  reduced motion, sockets, camera/input isolation, and persistence schema ownership.
- Fresh review: 4 files, 44 tests passed; `git diff --check` passed.
