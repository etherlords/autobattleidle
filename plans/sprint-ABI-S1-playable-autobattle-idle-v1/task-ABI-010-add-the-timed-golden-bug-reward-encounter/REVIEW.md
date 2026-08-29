---
plannerFormat: 1
id: ABI-010
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-010 review

## Verdict

APPROVE

## Findings

- **P1 — Fixed ten-second deadline is extended by every hit.** `BattleController` resets `goldenBugDeadlineMs` after accepted manual and automatic hits, so repeated attacks can keep the event alive indefinitely. Anchor the deadline only when the active event first enters controller state (spawn, reload, restore, or reset), and add a nonlethal-hit regression proving the remaining window is unchanged except for elapsed time.
- **P2 — Direct V2 slot migration retention is not proved.** Existing migration coverage uses V1 or the unversioned compatibility key. Add a `SAVE_V2_KEY` fixture that proves byte-for-byte V2 retention, V3 publication, and stable V3 reload.

Independent checks passed before these findings: focused ABI-010 tests 49/49, full `pnpm check` 86/86, and `git diff --check`. Real-browser, CI/Pages, and deployed proof remain correctly pending.

Fresh re-review confirmed both findings resolved with no P0-P3 remaining. The deadline is anchored per Golden Bug event identity and remains fixed across nonlethal manual/automatic hits, including equality timeout. A direct V2-slot fixture preserves source bytes while publishing and stably reloading V3. Focused checks passed 20/20; full `pnpm check` passed 88/88; `git diff --check` passed.
