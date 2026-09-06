---
plannerFormat: 1
id: ABI-054
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-054 implementation-guide

## Frozen scope

- Change only authored Goose Hydra loaded-body cue/decal placement and the focused behavior regressions. Do not alter Catbug, procedural decoration, legacy/no-overlay behavior, persistence, or global transforms.
- Keep the semantic decal projector body-relative and reject invalid/clipped/detached patches. Preserve deterministic behavior and idempotent disposal.

## Implementation sequence

1. Fit Goose Hydra standalone cue sockets and orbit radius from loaded authored bounds while retaining the fallback head anchor for top cues.
2. Project semantic decals with patch-center rotation and a world-space body-proximity guard; suppress invalid output and avoid duplicate disposal traversal.
3. Run focused enemy visual tests, TypeScript, ESLint, Prettier, and `pnpm check`.
4. Reconcile independent review and browser QA evidence, push the scoped commit to `main`, wait for CI and Pages, and verify the production visual-lab URL.

## Verification matrix

- Unit: `src/game/enemy-visual.test.ts` covers Goose socket fitting, semantic decal geometry, invalid suppression, cleanup, and preservation of other families.
- Integration/deployed: local and public `visual-lab.html?family=boss-goose-hydra&grade=boss&recipe=production` desktop/narrow scenarios show attached cues/decals with zero console errors/warnings; post-push public evidence is required for final closure.
- Gates: implementation self-check evt-ed8e9799-724f-4ec6-8405-47b5bb9697ac; independent review evt-d55836a3-5f48-4efb-a1f6-8aa7c17a2cfb; independent QA evt-bcf0fab1-8c10-485c-a109-4677c2c30ca0; verification and manager closure recorded natively after deployment.
