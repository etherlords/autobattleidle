---
plannerFormat: 1
id: ABI-003
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-003 implementation-guide

## Frozen scope

- Implement only snapshot-driven Three.js battlefield presentation for ABI-003.
- Include distinct player/enemy placement, four grade silhouettes, geometry/label cues for elite
  modifiers and bosses, bounded spawn/hit/death/boss feedback, resize behavior, and deterministic
  cleanup.
- Exclude persistence/save work (ABI-005), balance tuning (ABI-006), new combat formulas, and a second
  animation or simulation scheduler.

## Implementation sequence

1. Preserve `Battlefield.render(snapshot)` and the existing application RAF as the only render loop.
2. Introduce the smallest testable scene/renderer seam needed for headless lifecycle checks.
3. Build stable player presentation and a grade-specific enemy group from existing Three.js
   primitives; use silhouette/scale/attachments as well as color.
4. Compare the previous and current snapshot to trigger one bounded spawn, hit, death, or boss cue.
5. Expire effects during render, cap their count, dispose retired geometry/materials, and make final
   disposal idempotent.
6. Add focused unit/integration tests, run them, then run `pnpm check` before independent review.

## Verification matrix

- Unit: construct/render grade snapshots for normal, veteran, elite modifiers, and boss; assert stable
  object/effect counts and exact disposal after replacements and final shutdown.
- Integration: drive manual/automatic damage and encounter transitions through the application and
  prove the battlefield receives snapshots while the deterministic domain results remain unchanged.
- Browser QA: use real pointer/keyboard combat on desktop and narrow viewports; observe hit, death,
  spawn, elite modifier, and boss cues; sample bounded scene/listener/RAF counts during a long run;
  confirm clean console and teardown.
- Delivery: `pnpm check`, coherent commit/push, successful CI and Pages deployment, then repeat the key
  functional/visual scenarios at the public URL.
