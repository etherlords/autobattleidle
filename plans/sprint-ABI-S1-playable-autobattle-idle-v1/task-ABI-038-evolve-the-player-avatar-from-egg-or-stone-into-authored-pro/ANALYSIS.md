---
plannerFormat: 1
id: ABI-038
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-023
  - ABI-026
  - ABI-037
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-038 analysis

## Complexity and ownership

- **Complexity: XL product/content/engineering.** It requires measured milestones, multiple approved 3D recipes, deterministic selection, PlayerUnit integration, sockets/camera fit, transition choreography, save equivalence, resource lifecycle, and deployed visual proof.
- ABI-037 owns prototyping and inspection; ABI-020 owns progression stages. ABI-038 owns only the derived player form sequence and PlayerUnit production port, with no stats or customization system.
- Do not merge into ABI-037: the lab is reusable tooling, while form recipes and PlayerUnit lifecycle are shipped gameplay presentation.

## Verified current state

- `PlayerUnit` already uses the shared Unit MVC but currently constructs one `PlayerUnitView`; enemy visuals have the mature body/component/profile/decorator architecture. Evolution should extend the player owner, not reuse enemy state or add a parallel scene entity.
- ABI-020 defines elapsed-time progression stages and accepted high-level economy; those measured stages are the correct milestone input. ABI-037 provides the all-angle/animation approval surface required before production geometry.
- Current save V4 stores canonical progression/player upgrade state. A form can derive from existing values, so the default persistence classification is **no schema change**. A stored evolution ID is prohibited unless preflight proves derivation cannot preserve identity.
- The request is visual progression from egg/stone into more complex forms, not an inventory, character creator, equipment system, or stat bonus.
- Fresh source audit confirms the player view is currently only one icosahedron plus one cylinder in `src/game/units/player/view.ts`; `PlayerUnitSnapshot` contains position only and `sameIdentity()` is unconditional. `ThreeBattlefield` constructs one `PlayerUnit`, attaches it once, and disposes it once. The narrow production seam is therefore player-local snapshot identity plus one view-owned replaceable body subtree; battlefield combat scheduling must not become a second owner.
- The accepted progression contract has six encounter bands: `1-99`, `100-499`, `500-999`, `1,000-9,999`, `10,000-36,364`, and `36,365+`. A fresh event-jump measurement on the production path reached encounter 15 at 0.25h, 53 at 1h, 3,535 at 6h, 8,225 at 12h, 17,605 at 24h, and 36,365 at 48h. Candidate form boundaries reuse the six existing stage starts; there is no independent evolution counter.
- Form-count ceiling is six, one per accepted stage. This is a ceiling rather than an implementation mandate: a prototype may merge visually indistinguishable adjacent early stages before approval, but production cannot add extra speculative tiers.
- Persistence impact is **no schema change**. Current and V1-V4 migrated combat state already restore encounter and player upgrades, so reload-equivalent state derives the same stage. Acceptance still requires historical load -> render -> save -> reload proof.
- Acceptance classification: selector/boundaries and disposal are unit; PlayerUnit replacement, sockets, unchanged combat values, and migrated reload are integration; all-angle form approval, transition timing, reduced motion, responsive camera, exact-SHA Pages, and historical-save visible identity are deployed/browser.

## Approach

- Freeze a small sequence of forms against ABI-020 stage boundaries and name the exact derivation rule. Each form must change silhouette and one animation/detail, not only palette.
- Prototype each form in ABI-037, review all angles and attack/idle states, then port approved recipes into player-local body/component factories.
- Let `PlayerUnitModel` expose derived presentation identity and `PlayerUnitView` own one current form subtree. Replace at one sync seam, optionally with a short visual-only handoff, and dispose the previous subtree once.
- Preserve combat input, camera framing, player attack origin, high-APS cadence, and all domain formulas.
- Prototype-only work may extend the existing ABI-037 lab and its resource ledger. No production `PlayerUnit` geometry is edited before explicit visual approval.

## Risks

- Milestones based on a changing formula can visually regress old saves. Freeze against canonical values/stages and add boundary fixtures for V1-V4 migrations.
- Rebuilding on every snapshot leaks GPU resources. Replace only when derived form identity changes.
- Larger silhouettes can occlude enemies/HUD or move attack origins. Verify responsive framing and semantic sockets at every form.
- Scope can expand into cosmetics/equipment. Keep only the approved linear visual sequence; future customization is a separate product task.
