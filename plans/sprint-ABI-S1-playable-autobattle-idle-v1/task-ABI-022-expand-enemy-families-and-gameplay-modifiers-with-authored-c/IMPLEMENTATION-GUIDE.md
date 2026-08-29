---
plannerFormat: 1
id: ABI-022
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-022 implementation-guide

## Frozen scope

- Only ABI-022: three new active modifier IDs, three linked ordinary body families, three deterministic authored visual variants for all eight body families, family-aware decoration/shield composition, finite UI labels, save validation, focused tests, Vault updates, and release evidence.
- Preserve current combat formulas, boss cadence, rewards, encounter identity, old modifier behavior, save version/shape, input, HUD layout, effects, and application orchestration. No dependency, asset pipeline, event bus, backend, analytics, or speculative abstraction.
- Accepted family contracts:
  - `mantis`: narrow vertical thorax, paired forward scythes, high lateral attachment anchors, restrained lime/teal/amber palettes, small asymmetric crest/satellite details.
  - `sentinel`: stacked octagonal core, shoulder pylons, broad grounded shield-compatible anchors, slate/cobalt/copper palettes, offset scar/orbital details.
  - `drake`: low diamond torso, swept wings and tail, rear/lateral anchors, crimson/indigo/ice palettes, asymmetric horn/fin details.
- Existing beetle, brute, wisp, colossus, and hydra keep their body identity and gain three coordinated family-local palette/decor profiles. Every profile names attachment points; seeded choice is stable and bounded.
- Modifier contracts: `hardened` composes bounded health and armor draft rules; `critical-guard` suppresses only the critical multiplier; `manual-guard` reduces only manual post-armor damage with the existing minimum-damage floor. Their cues are respectively reinforced band, prism guard, and directional barrier; none changes reward or cadence.

## Implementation sequence

1. Extend the serializable modifier union, exhaustive registry/order, pure strategies, attack policy, explicit save validation/roll mapping, and finite HUD labels. Add deterministic tests before visual work.
2. Extend `EnemyVisualSpec` with exhaustive family/variant composition selected from stable identity. Register the three family factories without adding selection ladders.
3. Move palette/decor/attachment data into family-local finite profiles; pass the selected profile through the existing body/decorator builder. Correct shield and ornament transforms at that seam.
4. Add focused factory, variant-matrix, animation, resource-bound, disposal, modifier-interaction, old-family, and historical/current save tests. Run the relevant Vitest slice, then `pnpm check`.
5. Independent Reviewer audits domain/view/persistence ownership and the rendered matrix. After any bounded repair and fresh re-review, independent browser QA verifies every family/variant and modifier at desktop and 390px plus gameplay transitions, console/network, repeatability, reload, and long-run disposal.
6. Update the two canonical architecture/design articles through Vault, index/doctor, then Manager records verification/closure, commits through the native hook, pushes, and proves exact-SHA CI, Pages, deployed behavior, final health, and lease release.

## Verification matrix

- Unit: all six modifier roll boundaries; old three modifier outputs unchanged; new health/armor/attack rules; manual versus automatic critical behavior; invalid roll/value rejection; exact current and historical save load/save/reload; exhaustive registries.
- Unit/view: 8 families x 3 variants deterministic equality and non-identical authored palettes/decor; all grade/modifier cues; front/side attachment bounds; bounded meshes/children; animation tick; repeated idempotent disposal; unchanged representative old-family selection.
- Integration: real manual and automatic attacks demonstrate each new rule; encounter transitions and rewards remain unchanged; HUD labels are readable; stored current and historical saves reload to the same accepted state.
- Browser/deployed: full family-by-variant plus modifier/shield/decor matrix at desktop and 390px, front and side; no clipping, detached parts, accidental cue loss, layout overlap, console errors, failed requests, listener growth, or scene-resource growth. Screenshots are receipts alongside functional assertions.
