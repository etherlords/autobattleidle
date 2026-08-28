---
plannerFormat: 1
id: ABI-009
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-009 analysis

## Verified current state

- `src/game/battlefield.ts` is the sole Three.js owner. It already replaces visuals by the
  snapshot identity `(grade, level, modifier)`, caps transient effects at 12, and disposes
  retired geometry/materials plus the renderer idempotently.
- The current enemy is one grade-selected primitive. Armor, health/vitality, and automatic-slow
  have simple geometric cues; there are no seeded decorations, multiple body families independent
  of grade, dedicated boss families, or wealth cue.
- `BattleSnapshot.enemy` carries grade, level, modifier, health, max health, and name. It does not
  carry mutable simulation objects. Enemy level is the stable deterministic seed available today.
- Domain reward semantics are already explicit: `CombatEnemy.reward` is the deterministic base
  reward for the encounter/grade; the player-owned double-reward roll is applied only on defeat.
  There is no wealth enemy modifier in `EliteModifier`, so rendering must not infer or activate one.
  The factory may expose a dormant wealth composition for visual proof, but runtime activation waits
  for a domain snapshot that documents an increased-reward rule.
- Persistence impact: no schema change. Snapshot/presentation changes must still preserve the
  existing historical-save load, save, and reload checks.

## Approach

- Extract one small snapshot-driven enemy visual factory in `src/game`; keep battlefield replacement,
  effects, and disposal ownership where they already live.
- Select a small body family from the stable enemy level, then compose grade/boss silhouette,
  modifier attachments, and seeded ornaments. Bosses use dedicated constructors, not a scaled normal
  body. Color remains secondary to silhouette, attachment, and bounded motion.
- Return inspectable composition metadata with the Three.js group so deterministic unit tests and a
  bounded visual matrix can prove every family/cue without duplicating gameplay state.
- Reuse Three.js primitives and the existing disposal path. Add no assets, dependencies, simulation
  state, persistence fields, generalized builder, or animation framework.
- Acceptance layers: deterministic selection/composition/disposal are unit; live snapshot replacement,
  historical-save neutrality, and long-run object/resource bounds are integration; desktop/narrow
  visual recognition, clean console, exact-SHA Pages, and public asset parity are deployed evidence.

## Risks

- A visual-only wealth flag could imply nonexistent rewards. Keep it inactive in the live snapshot
  path until the domain supplies documented semantics; label synthetic matrix evidence accordingly.
- Shared geometry/materials would make per-object disposal unsafe. Keep ownership local to each
  composed enemy unless reference counting is actually needed.
- Seed math can drift across reloads if it uses time or render order. Derive every choice only from
  stable snapshot identity.
- Decorations can obscure cues at 390px or grow resources over long sessions. Bound child counts,
  use distinct silhouettes, and verify repeated replacement plus final idempotent disposal.
