---
plannerFormat: 1
id: ABI-011
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-011 analysis

## Verified current state

- Planner selected only ABI-011: ABI-009 and ABI-010 are Done, the task is Ready and leased to
  `root-manager`; ABI-020 remains independently Blocked and is out of scope.
- `BattleController` already exposes immutable attack outcomes, but `startApplication` discards the
  subscribed controller event and re-reads a plain current update. `BattleSnapshot` therefore cannot
  distinguish ordinary, armor-prevented, critical, Golden Bug kill, or Golden Bug escape cues.
- `src/game/battlefield/effects.ts` already owns capped Three.js effects (`maximumActive: 12`), expiry,
  geometry/material disposal and the enemy anchor. `battlefield/lifecycle.ts` already owns scene
  replacement and idempotent disposal. These are the shared seams to extend, not replace.
- Current spawn/hit/death/boss rings are snapshot-driven but mostly color variants. The existing enemy
  factory already provides non-color Golden Bug and boss identity.
- Vault requires presentation-only snapshots/events, deterministic replacement/disposal, primitive
  Three.js visuals, and no combat outcome mutation.
- Persistence impact: **no schema change**. Existing V1, V2 and historical-save load/save/reload checks
  remain mandatory regression proof because only presentation contracts change.

## Approach

- Preserve the controller event through the application render path and map it once in the presenter to
  a small immutable visual-cue list. No cue feeds back into combat, rewards, cooldowns or progression.
- Extend the existing effect kind/config/factory with distinct installed-Three geometry for ordinary,
  armor, critical, death/reward, boss and Golden Bug outcomes. Reuse the current cap, tick and disposal
  path; use native `matchMedia('(prefers-reduced-motion: reduce)')` state without a new dependency or
  listener.
- Keep coin feedback anchored near the defeated enemy and emitted from the same awarded-reward outcome
  that produces the bounded log entry.
- Focused tests prove event mapping, non-color geometry/scale identity, cap/expiry/disposal, reduced
  motion, and no repeated cue on idle frames. `pnpm check` supplies the historical persistence regression.

## Risks

- A stale cue could replay every animation frame. Prevent this by rendering the subscribed event once;
  plain `currentUpdate()` carries no cues.
- Enemy replacement can produce duplicate generic death/spawn effects. Define one mapping owner and
  assert exact effect sequences.
- Reduced motion that removes cues entirely would fail readability. Retain static/short cues while
  disabling growth/translation.
- Geometry/material leaks during cap eviction, expiry or scene replacement are blocking; retain the
  existing single `retire`/`disposeObject` route and test it.
