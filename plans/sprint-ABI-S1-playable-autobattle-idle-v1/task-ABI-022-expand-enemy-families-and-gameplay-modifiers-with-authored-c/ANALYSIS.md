---
plannerFormat: 1
id: ABI-022
artifact: analysis
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

# ABI-022 analysis

## Verified current state

- Root audit on 2026-08-29 proved `HEAD == origin/main == acd257833e5244a11612c769ad20b65e5d068540` after a fresh fetch. Planner 1.1.2 selected ABI-022 at task revision 4/progress revision 3; ABI-015 and ABI-023 are Done, no foreign lease existed, and doctor reported zero findings with no recovery required. Vault reported 14/14 fresh indexed articles, zero findings, and no unresolved links.
- The live visual catalog has ordinary `beetle`, `brute`, and `wisp` bodies plus boss `colossus` and `hydra`; armor, health, and automatic-slow are the only active domain modifiers. `EnemyUnitBuilder.composeView` already routes an exhaustive body registry through grade, modifier, and seeded-decoration decorators. Stable identity comes from level, grade, and modifier.
- The current save payload stores only the active modifier ID plus derived enemy values. ABI-022 is a **no schema change**: new modifier IDs extend current validation, while all derived health/armor/reward values must still match deterministic spawning. V1/V2/current historical saves must load, save, and reload without being rewritten or reset.
- Acceptance classification: deterministic selection, formulas, codec validation, factory exhaustiveness, animation, and disposal are `unit`; app transitions, HUD text, and historical-save reload are `integration`; full family/modifier matrices, desktop/390px composition, resource bounds, CI, Pages, and deployed gameplay are `deployed`.

## Approach

- Add three ordinary visual families through the existing exhaustive factory: `mantis` (long thorax and paired scythe forelimbs), `sentinel` (stacked armored core and shoulder pylons), and `drake` (low diamond torso, swept wings, and tail). They are selected only by the three new modifiers, so existing modifier/null family selection remains stable.
- Add `hardened` (combined bounded health and armor draft), `critical-guard` (critical rolls land as ordinary damage), and `manual-guard` (manual damage is reduced after armor, with the one-damage floor). No modifier needs player health, a hidden roll, a counter, or a save field. Existing modifiers, cadence, rewards, and old attack formulas stay byte-for-byte semantically unchanged.
- Give every shipped family three authored variants selected from the existing stable seed. A family-local profile owns coordinated body palette, decoration pair, attachment points, and asymmetry. Grade and modifier cues stay independent and non-color-readable. Rework shield plates and decorations at the same composition seam so attachments sit against the silhouette and component counts remain bounded.
- UI text uses a finite label mapping. Controller implications reuse the existing hit/death event chain because the new rules resolve in the pure attack/spawn transition and require no new global event or mutable runtime owner.
- Rejected: regeneration/ward charges (new mutable save state), thorns/lifesteal (unsupported player-health model), evasion (hidden attack randomness), wealth (would change rewards), random primitive placement, external assets, a new renderer pipeline, and per-row subclasses.

## Risks

- Enum extension can reject historical/current saves or select the wrong modifier if roll mappings drift. Use explicit current ID-to-roll mapping, preserve legacy validation semantics, and test every old and new ID.
- Generic decoration offsets can intersect new silhouettes or appear detached on bosses. Make attachment profiles family-owned, audit shield/decor placement in front/side views, and reject any matrix cell that clips or obscures grade/modifier cues.
- More meshes can leak or exceed scene bounds. Keep fixed small component counts, reuse builder disposal, assert maximum meshes/children, and run repeated spawn/replace/dispose browser telemetry.
- Visual variety can erase identity. Derive the three variants only from the existing stable seed, preserve old body selection for existing modifiers, and keep grade/modifier cues independent from palette.
