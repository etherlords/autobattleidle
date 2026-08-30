---
plannerFormat: 1
id: ABI-031
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-031 analysis

## Verified current state

- The public baseline and local source share one motion owner in `src/game/enemy-visual/bodies.ts`. Its tick increments idle phase, resets the pose to authored transforms, and applies idle lift only when no command is active.
- `hit` and `critical` start with `peak = 0`. Their first tick therefore drops the already-rendered idle position to authored zero. A command issued during another reaction likewise drops the current squash because the new command restarts from authored neutral.
- Hydra heads, Colossus parts, head cues, and side cues already inherit semantic anchors; the reported detachment is the visible consequence of the parent pose discontinuity, not a second animation owner.
- Family profiles vary `attachment`, but seeded decoration, grade, and modifier geometries use fixed sizes. Coordinates change while mesh proportions do not, producing undersized or oversized cues across bodies.
- Persistence impact: no schema change. Historical save load/reload remains covered by the full project gate because this repair changes presentation only.

## Approach

- Preserve one shared rig: capture the currently rendered pose when a command arrives, decay that residual continuously while applying the existing neutral-to-peak-to-neutral curve, and keep idle motion active under reactions.
- Reuse the existing profile attachment width as the single family-fit input, clamped to a bounded scale. Apply it centrally to seeded decorations, grade cues, and modifier cues; do not add runtime bounds layout or family-specific animation forks.
- Add deterministic tests that fail on the current first-frame position snap, overlapping-command scale snap, drift, anchor inheritance, and unscaled family cues before running the complete check.

## Risks

- A residual transform can accumulate if it is sampled after reset rather than at command dispatch; tests must cover repeated and overlapping commands.
- Scaling translations as well as geometry can move cues through or away from the surface. Keep existing profile-owned positions and scale cue geometry only.
- Boss world grade scale already scales the whole composed view. Fit must remain local and must not apply grade scale twice.
