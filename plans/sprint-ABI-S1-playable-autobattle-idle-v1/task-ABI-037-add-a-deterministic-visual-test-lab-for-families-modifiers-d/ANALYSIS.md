---
plannerFormat: 1
id: ABI-037
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-037 analysis

## Complexity and ownership

- **Complexity: XL tooling.** It needs a debug-only build boundary, production-factory parity, deterministic case URLs, injected time, animation controls, diagnostic overlays, serial exhaustive smoke, resource accounting, responsive UI, and hard save/network isolation.
- This is the one reusable visual/concept lab for ABI-029, ABI-036, and ABI-038. Those tasks add recipes and cases; none may create a second renderer or duplicate inspection controls.
- Keep the lab independent from content tasks so production parity, isolation, and disposal are verified once and reused.

## Verified current state

- Production factories and tests now cover eight family keys, grades, modifiers, deterministic profiles, sockets, animations, effects, replacement, and disposal. The evidence is code/test-oriented; there is no reusable interactive surface for selecting a case, orbiting it, replaying phases, or inspecting sockets/bounds/resources.
- ABI-029 contains a concept-lab acceptance step, but that is a design workflow for new candidates. A persistent production-parity test lab is a separate tool: it must enumerate current registries and reproduce defects without becoming another renderer or content source.
- `createBattlefield`, Unit MVC, body/decorator registries, and animation commands are reusable seams. The lab can compose them with an injected renderer/clock and a developer-only UI.
- Persistence impact is **no schema change** and ideally no storage at all. Reproducible case state belongs in validated URL parameters or an in-memory fixture.

## Approach

- Create one developer entry/route guarded by an explicit build flag. It imports production registries/factories and exposes selectors for family, grade, modifier, seed/profile, viewport, reduced motion, and cue/animation.
- Add orbit and canonical view presets, pause/replay/speed/frame-step controls, and opt-in overlays for axes, sockets, bounds, object/mesh/material/texture counts, active effects, and disposal receipts.
- Encode a bounded case ID in query parameters so review/QA can reopen exact state. Validate every value against registries and clamp numeric inputs.
- Keep the normal game bundle/route unchanged unless the debug flag is explicitly built. Never load saves, leaderboard, network clients, or production progression.

## Risks

- A copied mock visual drifts from production and creates false proof. The lab must import the same constructors and registries; fixtures supply only inputs/clock.
- A debug route accidentally shipped publicly can expand surface area or bundle size. Test both normal and debug builds and make the boundary explicit.
- Full matrices can allocate thousands of WebGL objects. Enumerate serially, dispose each case, and assert bounded resources rather than rendering all combinations at once.
- Screenshots alone cannot prove animations or cleanup. QA records case ID plus state, action/time, and visible/resource result.
