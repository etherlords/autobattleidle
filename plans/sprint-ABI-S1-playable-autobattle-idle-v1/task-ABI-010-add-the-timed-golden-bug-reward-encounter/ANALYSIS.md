---
plannerFormat: 1
id: ABI-010
artifact: analysis
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

# ABI-010 analysis

## Verified current state

- `CombatState` owns enemy, economy, progression, and automatic scheduling; `attack` is the one manual/automatic damage path and currently replaces a defeated enemy immediately.
- `BattleController` owns the live clock and frame dispatch. Snapshots feed both the DOM HUD and Three.js enemy units; neither presentation layer mutates simulation.
- Save V2 exact-key validation persists enemy/player/economy but reconstructs the automatic deadline. Adding resumable Golden Bug state is therefore a schema migration, not a compatible extension.
- Vault authority requires a separate timed-event transition, ten-second target window, exactly-once reward/escape, compact metallic body, non-color cue, and ordinary progression continuity.
- ABI-010 is Ready with every dependency Done and the only active lease is this manager session. Planner selected ABI-010; ABI-018 remains Ready and will not be started.

## Approach

- Spawn one Golden Bug after each 50th defeated progression encounter. Preserve the next ordinary encounter as `resumeEncounter`; kill or timeout resumes it without advancing twice or changing the 35-encounter boss sequence.
- Use a 10,000 ms live deadline. Bug health is five times the maximum non-random base automatic damage deliverable in that window (`ceil(window / interval) * baseDamage * 5`). Even all-critical automatic hits stay below health; a measured 10 Hz manual envelope plus automatic hits can defeat it without moving the automatic schedule.
- Grant a fixed saturated reward equal to ten times the resumed progression enemy's base reward. It is unaffected by double-reward randomness, awarded once on kill, and zero on timeout.
- Add explicit progression-vs-Golden-Bug identity to canonical state/snapshots. The controller handles timeout before automatic frame damage; attacks continue through the shared domain command.
- Ship Save V3. Persist active-event identity plus `resumeEncounter`, never the absolute deadline or presentation objects. V1/V2 migrate one version at a time; loading an active V3 event starts a fresh ten-second window and preserves all source slots.
- Reuse the existing enemy unit/view lifecycle, HUD status owner, persistence boundary, and tests. Add only a compact gold body/event cue, one countdown row/bar, and the minimum transition/formula helpers.

## Risks

- Timeout and kill on the same timestamp could duplicate or skip progression; timeout wins at the deadline and stale attacks must be ignored.
- Reward or encounter rollover can exceed safe integers; reuse saturation and `MAX_ENCOUNTER` handling.
- A V3 migration can silently lose valid V1/V2 progress; fixtures must prove V1 -> V2 -> V3 and V2 -> V3 load/save/reload while retaining old slots.
- Replacement visuals or HUD timers can leak resources/input; reuse current unit disposal and passive HUD pointer behavior and prove bounded replacement.
- ABI-011 owns richer Golden Bug effects. ABI-010 adds only the dedicated body, metallic/event identity, countdown, and existing bounded spawn/kill/escape feedback needed for functional acceptance.
