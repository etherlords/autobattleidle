---
plannerFormat: 1
id: ABI-059
artifact: progress
project: ABI
profile: high-assurance
revision: 30
status: In Progress
sprintId: ABI-S1
dependencies:
  - ABI-056
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-059 progress

## Current state

- Status: In Progress
- Revision: 30
- Last update: Bounded Goose high-detail guard fix retested with visible decals, frame-budget success, lifecycle coverage, and documented cold-load limitation.

## Execution plan

- [x] investigate: Measure current Goose Hydra decal geometry, raycast, and frame-gap cost; inspect scheduler and cache seams.
- [x] implement: Implement the safest bounded projection/raycast reuse or frame-budgeted refresh without changing visuals or persistence.
- [x] cover: Add focused regression and timing coverage for deterministic refresh, disposal/cancellation, and fallback behavior.
- [x] verify: Run unit/integration/deployed checks and record exact before/after measurements and limitations.
- [x] high-detail-profiler: Split production high-detail refresh cost between DecalGeometry traversal and detached guard raycasts before selecting the smallest safe fix.
- [x] high-detail-fix: Implement and retest the smallest safe high-detail Goose fix selected by the profiler split, preserving visibility, cancellation, disposal, and semantic visual contracts.

## Events

### evt-107dd7f2-a074-4370-b7c1-f98864c64d1b

- Timestamp: 2026-09-09T20:43:12.174Z
- Actor: goose-decal-performance-refinement
- Operation: claim.acquire
- Prior revision: 1
- Resulting revision: 2
- Summary: Claimed task lease: Investigate and implement safe Goose Hydra semantic decal refresh performance improvements
- Idempotency key: abi-059-claim-20260910
- Request fingerprint: 366d23bd6ff5e340926bd0645ed15351dc278cceec863bd6615a525044af7a3e
- Agent ID: goose-decal-performance-refinement
- Session ID: abi-059-session
- Intent: Investigate and implement safe Goose Hydra semantic decal refresh performance improvements
- Branch: main
- Expires at: 2026-09-09T21:43:12.174Z
- Evidence:
  - None

### evt-aecc09df-5339-46bf-a46f-f2484a43a175

- Timestamp: 2026-09-09T20:43:57.200Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 2
- Resulting revision: 3
- Summary: Preflight confirms ABI-056 is Done; acceptance is classified across unit, integration, deployed, with persistence explicitly no schema change. Investigating measured DecalGeometry/Raycaster and frame-gap costs before implementation.
- Idempotency key: abi-059-investigate-start-20260910
- Request fingerprint: c5af9ef58e5531bc339ed9b3ab2e1e8184ce6c5d251519b24aec046b7ac47823
- Action: set_state
- Step ID: investigate
- State: in_progress
- Evidence:
  - ABI-056 Done dependency readback
  - ABI-036 semantic-surface Vault decision
  - ABI-059 acceptance criteria

### evt-50d8bfd7-6bc7-4ffb-bc31-c72d1cff5d2d

- Timestamp: 2026-09-09T21:01:27.701Z
- Actor: goose-decal-performance-refinement
- Operation: task.advance
- Prior revision: 3
- Resulting revision: 4
- Summary: Preflight complete: ABI-056 Done dependency verified; acceptance classified as unit, integration, deployed, with persistence no schema change. Current synthetic Goose projection baseline is 919 Raycaster calls / 630 vertices / 42.951ms for 8 decals; implementation preserves cardinal-first guard as an early candidate with all remaining axes fallback and lifecycle-safe context invalidation.
- Idempotency key: abi-059-ready-to-in-progress-20260910
- Request fingerprint: 4e2cdf24e3d63e0587dc7d2528736e2a3eccdf7779251cff639b412f54c81a16
- From status: Ready
- To status: In Progress
- Evidence:
  - ABI-056 Done dependency readback
  - ABI-036 Vault semantic-surface decision
  - Synthetic baseline: 919 Raycaster.intersectObject calls, 630 generated vertices, 42.951ms
  - Acceptance classification: unit/integration/deployed; persistence no schema change

### evt-34290b28-f7dd-4c7f-8254-81d47f6056c8

- Timestamp: 2026-09-09T21:05:21.414Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 4
- Resulting revision: 5
- Summary: Measured current synthetic Goose Hydra baseline and inspected scheduler/cache seams. Detail-4 Icosahedron, 8 decals, 630 output vertices: legacy 919 Raycaster.intersectObject calls and 42.951ms first run (19.394ms warm all-mode run); ABI-056 browser cached transition remained 4,804.6ms final-ready with staged surfaces and ~5.44s semantic refresh, while GLB cache response was 15.5ms. Work is deferred but each decal still paid repeated body bounds/ray setup and six-axis guard probes.
- Idempotency key: abi-059-investigate-complete-20260910
- Request fingerprint: e96791b9752037f7529c96b918045d6d863570435809155907b92253be59dfcf
- Action: set_state
- Step ID: investigate
- State: complete
- Evidence:
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts
  - ABI-056 progress cached Goose transition 4,804.6ms / semantic refresh ~5.44s
  - Synthetic detail-4 baseline: 919 calls, 630 vertices, 42.951ms

### evt-fc222f74-c121-460f-a834-8f0485768e26

- Timestamp: 2026-09-09T21:05:30.207Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 5
- Resulting revision: 6
- Summary: Implementing the narrowest safe optimization: per-body WeakMap projection contexts reuse world bounds, projection/guard Raycaster instances, and scratch vectors; cardinal axis is tried first only, with all other axes retained as fallback on a miss. Context invalidates for body matrix, geometry identity, and position/index attribute versions.
- Idempotency key: abi-059-implement-start-20260910
- Request fingerprint: 911efe6d9591288ab973d13b131ee65859bcdec50496a47da6840f4731da9902
- Action: set_state
- Step ID: implement
- State: in_progress
- Evidence:
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts
  - ABI-036 disposal and body-local projection contract

### evt-42148b4e-77cf-426f-b882-63c7d3f566a3

- Timestamp: 2026-09-09T21:08:25.157Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 6
- Resulting revision: 7
- Summary: Implementation complete: per-body WeakMap context reuses bounds, Raycaster objects, and transform vectors; cardinal guard ray is early candidate and all other axes remain fallback; context invalidates on body transform, geometry identity, and position/index versions; idle timeout reduced to 16ms while retaining one-decal tasks. Deterministic visual and type self-checks pass.
- Idempotency key: abi-059-implement-complete-20260910
- Request fingerprint: 820eba2453946dccdc07a164c1f6738f7d8965cd854e604482f596ad51f5cb90
- Action: set_state
- Step ID: implement
- State: complete
- Evidence:
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts
  - pnpm exec tsc --noEmit: passed
  - pnpm exec vitest run src/game/enemy-visual.test.ts --reporter=dot: 48 passed
  - Synthetic optimized detail-4 all-mode: 638 Raycaster calls (8 projection + 630 guard), 630 vertices, warm median 11.546ms over 10 runs
  - Browser synthetic async: 54.8ms total, max event-loop gap 6.8ms, zero gaps >16.67ms with 16ms idle timeout

### evt-f04cbf17-aff3-468a-a13c-50e378b8ae90

- Timestamp: 2026-09-09T21:08:34.188Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 7
- Resulting revision: 8
- Summary: Focused coverage now exercises deterministic Goose semantic projection work, cardinal-first fallback on a rotated body, transform/geometry context invalidation, generated-resource disposal, body-geometry isolation, loaded GLB refresh, stale cancellation, visual envelope, and persistence compatibility.
- Idempotency key: abi-059-cover-start-20260910
- Request fingerprint: e8935b7f269c1358aa6a62b0f4738bac02e5d3c3f3df39a7f66dc570a6962323
- Action: set_state
- Step ID: cover
- State: in_progress
- Evidence:
  - src/game/enemy-visual.test.ts
  - src/persistence tests

### evt-1ad06bba-6ee6-4893-9cca-84eb42ac401b

- Timestamp: 2026-09-09T21:08:50.828Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 8
- Resulting revision: 9
- Summary: Focused regression and timing coverage passes: semantic visual suite is green with fallback and geometry-isolation assertions; persistence suite confirms supported saves continue to load/reload unchanged.
- Idempotency key: abi-059-cover-complete-20260910
- Request fingerprint: 2d6fe2e6700f907e81eef3067a55ce0cb0a762e3eb736c6024998f0971fb20f9
- Action: set_state
- Step ID: cover
- State: complete
- Evidence:
  - pnpm exec vitest run src/game/enemy-visual.test.ts --reporter=dot: 48 passed
  - pnpm exec vitest run src/persistence --reporter=dot: 36 passed
  - src/game/enemy-visual.test.ts fallback/context-isolation regression

### evt-97267178-46f5-473a-ac53-5997ac6596ca

- Timestamp: 2026-09-09T21:10:20.716Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 9
- Resulting revision: 10
- Summary: EVENT checkpoint — implementation and focused coverage complete. Optimized synthetic Goose detail-4 all-mode from 919 legacy Raycaster calls / 630 vertices / 42.951ms first run (19.394ms warm run) to 638 calls / 630 vertices / 11.546ms warm median; browser async refresh after 16ms idle timeout completed in 54.8ms with max sampled event-loop gap 6.8ms and no gaps above 16.67ms. Rotated-box fallback remained visible/non-empty with 29 fallback probes; geometry/transform invalidation and body-resource isolation pass. No save code changed.
- Idempotency key: abi-059-implementation-checkpoint-20260910
- Evidence:
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts
  - src/game/enemy-visual.test.ts
  - pnpm exec tsc --noEmit: passed
  - pnpm exec eslint changed semantic modules: passed
  - pnpm exec vitest run src/game/enemy-visual.test.ts --reporter=dot: 48 passed
  - pnpm exec vitest run src/persistence --reporter=dot: 36 passed
  - Browser local synthetic async measurement: 54.8ms / max gap 6.8ms

### evt-ebbc38c4-6507-4c8f-b0d8-fac29c7da3d7

- Timestamp: 2026-09-09T21:10:30.192Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 10
- Resulting revision: 11
- Summary: Verification in progress: scoped type/lint/visual/persistence checks pass; local browser Goose state is exercised. Remaining proof is exact post-change measurements and explicit cold GLB/frame-gap limitations for manager/independent QA review.
- Idempotency key: abi-059-verify-start-20260910
- Request fingerprint: fa7a6fe3f17e90ee767dd4a3ea63e43061b68c4396dc0aeaedbe92e5555521f9
- Action: set_state
- Step ID: verify
- State: in_progress
- Evidence:
  - ABI-059 implementation checkpoint progress rev 10
  - Local browser Goose Hydra at encounter 175
  - Persistence compatibility suite 36 passed

### evt-8f49cf2e-0081-49f7-be26-9ea9d6392eab

- Timestamp: 2026-09-09T21:15:16.482Z
- Actor: goose-decal-performance-refinement
- Operation: gate.record
- Prior revision: 11
- Resulting revision: 12
- Summary: Backfill typed implementation self-check gate from the owner’s implementation checkpoint and scoped verification evidence: per-body WeakMap context reuse/invalidation, cardinal-first guard fallback, lifecycle-safe refresh, visual/disposal isolation, and profiler measurements are recorded.
- Idempotency key: ABI-059-implementation-self-check-backfill-20260910T0215Z
- Request fingerprint: b81e2dd75d11b830a236aabeb25bdc61386d6ed1a0ca51d72b4cea56a5532e27
- Gate: implementation-self-check
- Verdict: pass
- Evidence:
  - Owner checkpoint evt-97267178-46f5-473a-ac53-5997ac6596ca at progress revision 10.
  - Scoped TypeScript check passed; scoped ESLint on semantic modules passed.
  - Focused visual and persistence suites passed: 48 visual tests and 36 persistence tests in owner evidence; current rerun 84 tests passed across 3 files.
  - Synthetic profiler evidence: legacy 919 Raycaster calls / 630 vertices / 42.951ms first run (19.394ms warm) versus optimized 638 calls (8 projection + 630 guard) / 630 vertices / 11.546ms warm median over 10 runs.
  - Browser synthetic async evidence: 54.8ms total, max event-loop gap 6.8ms, zero gaps >16.67ms with 16ms idle timeout; rotated-box fallback visible/non-empty with 29 fallback probes; transform/geometry invalidation and body-resource isolation pass.

### evt-1b87eb1a-6db7-45c2-8bf9-c5f80d50e7dd

- Timestamp: 2026-09-09T21:15:34.153Z
- Actor: abi059-independent-review
- Operation: gate.record
- Prior revision: 12
- Resulting revision: 13
- Summary: FAIL: implementation behavior and focused tests are sound, but current ABI-059 changed files are not formatting-clean. Scoped ESLint, TypeScript, visual/disposal/fallback/isolation tests, and profiler evidence pass; scoped Prettier fails semantic-surface-decorator.ts and enemy-visual.test.ts, so the repository quality gate is not green for this diff.
- Idempotency key: ABI-059-independent-review-20260910T0218Z
- Request fingerprint: 04922ea7d1f851d41e318f74a4bfb103665d1d0aa12ac1c25b977365ff90b9e5
- Gate: independent-review
- Verdict: fail
- Evidence:
  - pnpm exec eslint src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts: passed.
  - pnpm exec tsc --noEmit: passed.
  - pnpm vitest run src/game/enemy-visual.test.ts src/persistence: 3 files, 84 tests passed.
  - pnpm test current suite: 33 files, 354 tests passed.
  - pnpm exec prettier --check src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts: failed; semantic-surface-decorator.ts and enemy-visual.test.ts reported style issues (decorators.ts clean). Full pnpm check also stops at these formatting errors.
  - Source review: projectionContexts is a WeakMap keyed by body mesh; context refreshes on body matrix, geometry identity, and position/index versions, with cached world bounds/raycasters/vectors recomputed on invalidation. Cardinal direction is attempted first and remaining five directions are fallback probes. No strong cross-body cache key exists; body-local context prevents leakage. WeakMap has no explicit delete but does not retain keys after body reachability ends.
  - Source review: generated decal geometry/material disposal remains owned by disposeGeneratedNodes; refresh clears generated children; async refresh checks disposed/cancelled state between tasks; affinity textures use ref-counted cache release.
  - Regression coverage: rotated-box cardinal fallback remains non-empty; context invalidation after transform and replacement geometry is asserted; generated-resource disposal and body-geometry isolation are asserted; loaded GLB refresh and stale cancellation remain covered.
  - Profiler evidence from owner checkpoint: legacy synthetic Goose detail-4 all-mode 919 Raycaster calls / 630 vertices / 42.951ms first run (19.394ms warm) versus optimized 638 calls (8 projection + 630 guard) / 630 vertices / 11.546ms warm median over 10 runs; browser async 54.8ms total, max event-loop gap 6.8ms, zero gaps >16.67ms with 16ms idle timeout.

### evt-0f7f3459-78b5-42dd-9a38-46637909e025

- Timestamp: 2026-09-09T21:16:53.602Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 13
- Resulting revision: 14
- Summary: EVENT checkpoint — repaired Review FAIL evt-1b87eb1a by running scoped Prettier write on all changed files. Formatting now passes; scoped ESLint and TypeScript pass; visual/fallback/context-isolation and persistence regressions pass; browser synthetic async smoke remains within frame budget. Ready for fresh independent review/QA.
- Idempotency key: abi-059-format-repair-self-check-20260910
- Evidence:
  - Review FAIL evt-1b87eb1a progress 13
  - pnpm exec prettier --write src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts
  - pnpm exec prettier --check changed files: passed
  - pnpm exec eslint changed semantic modules: passed
  - pnpm exec tsc --noEmit: passed
  - pnpm exec vitest run src/game/enemy-visual.test.ts --reporter=dot: 48 passed
  - pnpm exec vitest run src/persistence --reporter=dot: 36 passed
  - Browser synthetic async smoke: 54.6ms total, max event-loop gap 6.9ms, zero gaps >16.67ms

### evt-a1317952-8140-49ac-a718-f411c847cd8f

- Timestamp: 2026-09-09T21:20:30.792Z
- Actor: abi059-independent-review-final
- Operation: gate.record
- Prior revision: 14
- Resulting revision: 15
- Summary: PASS: current ABI-059 semantic-surface-decorator, decorators barrel, and enemy-visual test diff is behaviorally and type/lint/format clean. WeakMap projection contexts are body-local and invalidate on transform/geometry changes; cardinal-first guard fallback, visual/disposal/cancellation semantics, and cross-body isolation are covered. Scoped and full tests pass. Full pnpm check is blocked only by unrelated untracked .tmp/abi059-baseline.test.ts formatting, not by ABI-059 files.
- Idempotency key: ABI-059-independent-review-final-20260910T0225Z
- Request fingerprint: bbaab1b3f58fa7d8900778a1dd20b73bab5b4826bb8ab6ecc1cd8dd75629a125
- Gate: independent-review
- Verdict: pass
- Evidence:
  - Scoped ESLint: pnpm exec eslint src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts passed.
  - Scoped formatting: pnpm exec prettier --check src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts passed after repair.
  - TypeScript: pnpm exec tsc --noEmit passed.
  - Focused current rerun: pnpm vitest run src/game/enemy-visual.test.ts src/persistence — 3 files, 84 tests passed.
  - Full current tests: pnpm test — 33 files, 354 tests passed.
  - Full pnpm check reached lint successfully but format:check stopped only on unrelated untracked .tmp/abi059-baseline.test.ts; no ABI-059 changed-file formatter/lint errors remain.
  - Projection cache review: projectionContexts is a WeakMap<THREE.Mesh, DecalProjectionContext>; cached bounds, Raycasters, and scratch vectors cannot cross body keys. Context invalidates when body matrix, geometry identity, position attribute version, or index version changes; updated bounds/ray distance/matrix are rebuilt on invalidation.
  - Fallback review: suppressDetachedDecal chooses dominant cardinal direction first, then probes each of the other five surfaceDirections only after a miss; performance counters distinguish primary guardRaycasts and fallbackGuardRaycasts.
  - Lifecycle review: refresh clears generated children; disposeGeneratedNodes removes nodes and disposes generated geometries/materials; async chunked refresh checks disposed/cancelled state between tasks; affinity texture references are released on dispose.
  - Regression review: rotated-box fallback remains visible/non-empty, transform and replacement-geometry invalidation are asserted, generated-resource disposal and body-geometry isolation are asserted, loaded GLB refresh and stale cancellation remain covered.
  - Profiler evidence: legacy synthetic Goose detail-4 all-mode 919 Raycaster calls / 630 vertices / 42.951ms first run (19.394ms warm) versus optimized 638 calls (8 projection + 630 guard) / 630 vertices / 11.546ms warm median over 10 runs; browser synthetic async 54.8ms total, max event-loop gap 6.8ms, zero gaps above 16.67ms with 16ms idle timeout.

### evt-cf9186e8-d951-4c4e-af08-cf56ddff6b2f

- Timestamp: 2026-09-09T21:23:07.081Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 15
- Resulting revision: 16
- Summary: EVENT checkpoint — removed only the untracked profiler temporary .tmp/abi059-baseline.test.ts identified by review; no source or artifact file removed. Full pnpm check now passes, focused ABI-059 regressions pass, and implementation is ready for independent QA.
- Idempotency key: abi-059-profiler-cleanup-self-check-20260910
- Evidence:
  - Fresh review PASS evt-a1317952 progress 15
  - Removed .tmp/abi059-baseline.test.ts
  - pnpm check: lint and format pass; 33 test files / 354 tests pass; worker tsc and production vite build pass
  - Focused vitest visual+persistence: 3 files / 84 tests passed
  - No commit or push

### evt-92b39f40-4e17-4b12-81ca-8463e2c26008

- Timestamp: 2026-09-09T21:30:19.826Z
- Actor: abi057-acceptance-qa
- Operation: gate.record
- Prior revision: 16
- Resulting revision: 17
- Summary: Native acceptance QA PASS: fresh pnpm check green; browser visual-lab Goose Hydra synthetic and production GLB cold/repeat paths exercised with decal geometry, raycast, and frame-gap measurements; cancellation/disposal and persistence/schema compatibility verified.
- Idempotency key: abi059-acceptance-qa-independent-qa-20260910
- Request fingerprint: 82ea4dbc655cab0532958b60031f96aec266d637808d2fc0f101dbcfc89db9a0
- Gate: independent-qa
- Verdict: pass
- Evidence:
  - Fresh pnpm check PASS: eslint, Prettier, 33 test files/354 tests, worker TypeScript check, tsc build, and Vite production build; only existing >500kB chunk warning.
  - Browser visual lab production Goose Hydra at http://127.0.0.1:5175/visual-lab.html?affinity=ice&family=boss-goose-hydra&grade=boss&modifier=none&variant=0&golden=0&motion=0&view=front&viewport=desktop&recipe=production&subject=enemy&stage=1&detail=1000&level=175 loaded identity boss-goose-hydra/body-0/ice, geometry crystal-crown,elemental-spines, live 45 objects/17 meshes/17 geometries/17 materials/4 textures; no console errors.
  - Production GLB cold synthetic load: fallback hidden while loading, then pose gltfStatus ready/visible with loaded body 15405 vertices and non-empty visible decal vertices scratch 504, left plate 441, right plate 621, affinity 2121; cold ready+refresh elapsed 6417.5ms. Remaining cold network/GLB decode and high-detail semantic work is reported as a limitation, not claimed zero lag.
  - Production repeat/refresh measured with loaded Goose asset: replacement path frame samples observed max gaps up to 895.8ms; direct loaded-body semantic refresh over 9s observed 8 decal projections, 5870 guard raycasts (551 fallback), 444 sampled frames, p95 7ms, max 2409.6ms with intermittent >50ms gaps. These spikes are documented as current high-detail GLB/DecalGeometry limitation; deterministic output remained valid and final decals non-empty/visible.
  - Browser synthetic Goose detail-4 all-mode: initial 8 decal projections/444 guard raycasts/0 fallback; async refresh final 16 projections/888 guard raycasts/0 fallback; 262 frames, max gap 7.1ms, p95 7ms, zero gaps >16.67ms; generated path completed without errors.
  - Cancellation/disposal synthetic: disposed immediately after spawn with pending asset; after await, scene children 1->0, group parent Scene->null, pose remained hidden, loaded body absent.
  - Persistence: production app localStorage save remained version 4/no schema change and reload-compatible in prior gameplay surface; ABI-059 changes are visual-only and pnpm persistence tests passed.

### evt-ebe9b15a-3375-41b5-b527-ac1a51795ae8

- Timestamp: 2026-09-09T21:33:25.093Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 17
- Resulting revision: 18
- Summary: Post-QA reassessment: independent QA PASS does not establish release readiness for high-detail Goose. Production cold ready+refresh is 6417.5ms; repeat replacement max gap 895.8ms; direct loaded-body refresh max gap 2409.6ms with 8 projections, 5870 guard raycasts, 551 fallback probes, p95 7ms but intermittent >50ms gaps. Current one-decal idle scheduling cannot preempt a single high-detail DecalGeometry call. Source inspection shows DecalGeometry scans every indexed source vertex and clips through six planes per projection; current WeakMap caches bounds/raycasters/scratch only, not projection output. Defer-until-visible is already present. Recommend no release; next narrow experiment must split DecalGeometry versus guard timing, then prioritize a bounded loaded-body projection proxy/cache or validated Goose guard reduction.
- Idempotency key: abi-059-post-qa-high-detail-reassessment-20260910
- Evidence:
  - evt-92b39f40-4e17-4b12-81ca-8463e2c26008 independent QA PASS
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts:383-497, 758-770
  - node_modules/three/examples/jsm/geometries/DecalGeometry.js:101-156
  - ABI-059 production measurements: body 15405 vertices; cold 6417.5ms; direct refresh max 2409.6ms; replacement max 895.8ms

### evt-6183a936-bdfb-4006-b7f4-2c73928fe57c

- Timestamp: 2026-09-09T21:37:27.972Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 18
- Resulting revision: 19
- Summary: Measure constructor and guard timings separately on the 15,405-vertex Goose GLB before changing behavior.
- Idempotency key: abi-059-plan-add-high-detail-profiler-20260910
- Request fingerprint: 2fe7ffcaa119dd5071d83c35875c09af2634538cb958fbe82cf81c9a94bdac59
- Action: add
- Step ID: high-detail-profiler
- Evidence:
  - evt-ebe9b15a-3375-41b5-b527-ac1a51795ae8
  - evt-92b39f40-4e17-4b12-81ca-8463e2c26008

### evt-053021f0-67a8-4ff3-84d3-ecc4d08052dc

- Timestamp: 2026-09-09T21:37:35.584Z
- Actor: goose-decal-performance-refinement
- Operation: execution_plan.update
- Prior revision: 19
- Resulting revision: 20
- Summary: Prefer preventing one huge synchronous DecalGeometry task via reusable loaded-body projection result/proxy; use conservative Goose-specific decal reduction only when visual acceptance proves it.
- Idempotency key: abi-059-plan-add-high-detail-fix-20260910
- Request fingerprint: cb0b0bf00da09466eeff85f75926558eeb8c7ef829e098250d925471989b6b71
- Action: add
- Step ID: high-detail-fix
- Evidence:
  - evt-6183a936-bdfb-4006-b7f4-2c73928fe57c
  - ABI-059 acceptance requires visual validity, deterministic output, lifecycle safety, and no persistence schema change

### evt-abbdc2de-2f12-48ba-bc02-29955bb8f4c9

- Timestamp: 2026-09-09T21:48:16.392Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 20
- Resulting revision: 21
- Summary: Profiler split and bounded high-detail implementation complete, pending fresh independent review/QA. Temporary browser timing showed production-shaped Goose body 15,405 vertices/33,168 indices: baseline 8 projections spent 34.6ms in DecalGeometry versus 11,585.0ms in detached guard over 14,943 guard rays/1,318 fallback probes. The smallest safe path is a Goose semantic-guard bound: bodies over 128 position vertices skip only detached per-output-vertex guard rays, while DecalGeometry projection output remains unchanged. Browser retest produced 8 visible/non-empty decals, 0 guard rays, 57.9-70ms refresh, and no suppression; focused semantic suite 49 tests and persistence suite passed (85 combined). Existing body visibility ordering, async cancellation, generated-resource disposal, and semantic tests remain intact. Temporary timing fields were removed before checks. No commit/push; keep ABI-059 In Progress and request fresh review/QA.
- Idempotency key: abi-059-high-detail-bounded-fix-checkpoint-20260910
- Evidence:
  - Local browser temporary split: baseline DecalGeometry 34.6ms; detached guard 11585.0ms; 14943 guard rays; 1318 fallback probes
  - Local browser bounded retest: body 15405 vertices; 8 projections; 0 guard rays; 8 visible/non-empty decal meshes; refresh 57.9-70ms
  - pnpm exec vitest run src/game/enemy-visual.test.ts src/persistence --reporter=dot: 3 files / 85 tests passed
  - pnpm exec prettier --check changed semantic files: passed
  - pnpm exec eslint changed semantic files: passed
  - pnpm exec tsc --noEmit: passed
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts:50, 384-435
  - src/game/enemy-visual.test.ts:1889-1929

### evt-f4beb0bc-caac-4eb3-8a62-04c5110e7543

- Timestamp: 2026-09-09T21:49:01.989Z
- Actor: goose-decal-performance-refinement
- Operation: gate.record
- Prior revision: 21
- Resulting revision: 22
- Summary: PASS: high-detail profiler split identified detached guard as the dominant production-shaped cost; bounded Goose guard bypass preserves projection output and lifecycle behavior. Focused checks are green. Limitation remains a measured 62.5ms maximum sampled frame gap, so this is not a zero-lag claim and fresh independent review/QA is required.
- Idempotency key: abi-059-implementation-self-check-high-detail-fix-20260910
- Request fingerprint: 6be56d98de3f687e7cf38d3c5e8679f3fc77f8f9a2975e0ffd97fc1ba7e8c926
- Gate: implementation-self-check
- Verdict: pass
- Evidence:
  - Temporary local browser split on Goose GLB body 15405 vertices/33168 indices: baseline 8 DecalGeometry projections 34.6ms total versus detached guard 11585.0ms, 14943 guard rays and 1318 fallback probes
  - Bounded retest: 8 projections, 0 guard rays, 8 visible/non-empty decal meshes, refresh 57.9-70ms; sampled max frame gap 62.5ms, p95 7ms, one gap over 50ms
  - pnpm exec vitest run src/game/enemy-visual.test.ts src/persistence --reporter=dot: 3 files / 85 tests passed
  - pnpm exec prettier --check src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual.test.ts: passed
  - pnpm exec eslint src/game/enemy-visual/decorators/semantic-surface-decorator.ts src/game/enemy-visual/decorators.ts src/game/enemy-visual.test.ts: passed
  - pnpm exec tsc --noEmit: passed
  - Temporary timing instrumentation and screenshots removed; no persistence code/schema changed
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts:50, 384-435
  - src/game/enemy-visual.test.ts:1889-1929

### evt-dc7e7174-4783-4ef5-85ac-f4fe32dd15ff

- Timestamp: 2026-09-09T21:49:12.722Z
- Actor: goose-decal-performance-refinement
- Operation: progress.append
- Prior revision: 22
- Resulting revision: 23
- Summary: EVENT checkpoint — implementation self-check PASS evt-f4beb0bc-caac-4eb3-8a62-04c5110e7543. Production-shaped profiling proved detached guard, not DecalGeometry, caused the high-detail spike: 15,405-vertex/33,168-index Goose body baseline measured 34.6ms DecalGeometry versus 11,585.0ms detached guard across 14,943 rays/1,318 fallback probes. The bounded Goose-only guard bypass for bodies over 128 position vertices reduces refresh to 57.9–70ms with 8 projections, 0 guard rays, and 8 visible/non-empty decals. Focused semantic+persistence coverage is 85 tests green; prettier, eslint, and tsc pass. Explicit limitation: sampled maximum frame gap remains 62.5ms (p95 7ms, one gap over 50ms), so no zero-lag or release claim. Body visibility ordering, cancellation, disposal ownership, and semantic tests remain preserved. Ready for fresh independent review; keep ABI-059 In Progress and do not commit/push.
- Idempotency key: abi-059-high-detail-fix-implementation-checkpoint-20260910
- Evidence:
  - evt-f4beb0bc-caac-4eb3-8a62-04c5110e7543 implementation-self-check PASS
  - Local browser split and bounded retest exact measurements
  - pnpm exec vitest run src/game/enemy-visual.test.ts src/persistence --reporter=dot: 3 files / 85 tests passed
  - src/game/enemy-visual/decorators/semantic-surface-decorator.ts:50, 384-435
  - src/game/enemy-visual.test.ts:1889-1929

### evt-c693a3ac-b543-4a2a-8955-3eccc22b98b5

- Timestamp: 2026-09-09T21:54:09.419Z
- Actor: abi059-independent-review-high-detail
- Operation: gate.record
- Prior revision: 23
- Resulting revision: 24
- Summary: PASS: ABI-059 high-detail Goose guard bound preserves DecalGeometry projection output while bypassing only detached per-output-vertex guard work above 128 position vertices. Existing rotated-body fallback, context invalidation, generated disposal, async cancellation/visibility ordering, and persistence boundaries remain sound. Focused and full checks are green. Production-shaped evidence records 11,585.0ms detached-guard cost versus 57.9–70ms refresh after the bound, with 8 projections, 0 guard rays, and 8 visible/non-empty decals. Limitation retained: sampled maximum frame gap is 62.5ms (p95 7ms, one gap over 50ms), so this is not a zero-lag or release-readiness claim.
- Idempotency key: abi059-independent-review-high-detail-20260909
- Request fingerprint: 2d7a289baf7d9989b9780b011728bb66f7b3d9cdab8f0234883a9acea180e887
- Gate: independent-review
- Verdict: pass
- Evidence:
  - pnpm vitest run src/game/enemy-visual.test.ts src/persistence: 3 files / 85 tests passed, including high-detail Goose output and guard-bound regression at src/game/enemy-visual.test.ts:1889-1929
  - pnpm test: 33 files / 355 tests passed
  - pnpm check: eslint, Prettier, 33 files / 355 tests, worker tsc, project tsc, and Vite production build passed; existing >500kB chunk warning only
  - Scoped ABI-059 ESLint, Prettier, and tsc checks passed
  - semantic-surface-decorator.ts:50-53 defines the >128 position-vertex bound; :395-435 retains semantic guard and cardinal-first/five-axis fallback for guarded bodies at or below the bound; :455-500 still performs raycast, DecalGeometry construction, output transforms, and returns the generated mesh
  - gltf-boss-body.ts:274-280 and :365-370 set semanticSurfaceGuard only for boss-goose-hydra in production loaded-body paths, so Catbug and other loaded families retain prior guard behavior
  - semantic-surface-decorator.ts:514-697 clears/disposes generated decal nodes on refresh/dispose and releases affinity texture ownership; :761-771 checks cancellation around async refresh and preserves visibility ordering
  - Production-shaped split: 15,405-vertex / 33,168-index Goose body measured 34.6ms DecalGeometry versus 11,585.0ms detached guard across 14,943 rays / 1,318 fallback probes; bounded retest 57.9–70ms refresh, 8 projections, 0 guards, 8 visible/non-empty decals; sampled max frame gap 62.5ms, p95 7ms, one >50ms
  - ABI-059 diff paths are limited to enemy visual decorator/barrel/test files; no persistence code or schema changed

### evt-48cdc230-29ae-42a4-9958-35d6cca1f9eb

- Timestamp: 2026-09-09T21:57:23.427Z
- Actor: abi057-acceptance-qa
- Operation: gate.record
- Prior revision: 24
- Resulting revision: 25
- Summary: Final native acceptance QA PASS: pnpm check/build green; production Goose Hydra cold/repeat visual refresh valid with visible decals and frame gap max 7.2ms after high-detail fix; other enemy families, cancellation/disposal, and no-schema persistence compatibility verified.
- Idempotency key: abi059-final-acceptance-qa-20260910
- Request fingerprint: aa9b57f38c5d9c6df1f661a601b1e0f5417ffa76d9c324c811b1f83dd189f83e
- Gate: independent-qa
- Verdict: pass
- Evidence:
  - Fresh pnpm check PASS: eslint, Prettier, 33 test files/355 tests, worker TypeScript check, tsc build, and Vite production build; only existing >500kB chunk-size warning.
  - Production visual lab URL http://127.0.0.1:5175/visual-lab.html?family=boss-goose-hydra&grade=boss&affinity=ice&modifier=none&variant=0&golden=0&motion=0&view=front&viewport=desktop&recipe=production&subject=enemy&stage=1&detail=1000&level=175 rendered Goose Hydra/body-0/ice with crystal-crown,elemental-spines. Cold reload with cache disabled transferred 7,768,644 bytes and reached ready receipt in 761ms; no console errors observed during load session.
  - Production Goose visibility: loaded body 15,405 vertices; visible non-empty decals surface-scratch-0 504 vertices, surface-shell-plate-left-0 441, surface-shell-plate-right-0 621, surface-affinity-mark 2,121.
  - Production repeat loaded-body refresh: 8 decal projections, 0 guard/fallback raycasts, 1,009 sampled frames over 7s, p95 7.1ms, explicit maximum frame gap 7.2ms, zero gaps >16.67ms; all four decals remained visible/non-empty.
  - Synthetic/browser Goose async path: detail-4 all-mode final stats 16 decal projections, 888 guard raycasts, 0 fallback; 262 frames, max 7.1ms, zero gaps >16.67ms.
  - Other enemy families rendered valid receipts without console errors: boss-catbug/body-0/ice geometry orbital-runes,elemental-spines; boss-hydra/body-0/ice geometry crystal-crown,elemental-spines; boss-colossus/body-0/ice geometry orbital-runes,elemental-spines; beetle/body-0/ice geometry legacy/no-overlay.
  - Cancellation/disposal: immediate disposal with pending Goose asset changed scene children 1->0, group parent Scene->null, and left loaded body absent after asset promise settled.
  - Persistence/no schema change: production app save.v4 remained version 4 with stable gameplay fields preserved across reload; existing save.v3 historical key remained present; fresh persistence tests passed.

### evt-a73b5ffc-7eee-4313-a953-2b79c827ed47

- Timestamp: 2026-09-09T21:58:07.113Z
- Actor: Main
- Operation: execution_plan.update
- Prior revision: 25
- Resulting revision: 26
- Summary: Final independent QA PASS reconciled with production cold/repeat Goose visual lab matrix, lifecycle/persistence checks, and full pnpm check/build.
- Idempotency key: ABI-059-plan-verify-complete-20260910
- Request fingerprint: 525a0ec2f15f61c3db78758ca107681c00130d534f9bee04b97562ef44778f78
- Action: set_state
- Step ID: verify
- State: complete
- Evidence:
  - evt-48cdc230-29ae-42a4-9958-35d6cca1f9eb
  - Production cold cache-disabled GLB 7,768,644 bytes ready in 761ms
  - Loaded body 15,405 vertices with 8 visible decals
  - 1,009-frame/7s repeat refresh p95 7.1ms, max 7.2ms, zero frames over 16.67ms
  - Other families, cancellation/disposal, persistence/schema, and pnpm check/build PASS

### evt-f8493bd9-7cb8-4c7c-80bd-fcde535bff64

- Timestamp: 2026-09-09T21:58:13.746Z
- Actor: Main
- Operation: execution_plan.update
- Prior revision: 26
- Resulting revision: 27
- Summary: Reconciling completed production-shaped cost split before closure.
- Idempotency key: ABI-059-plan-profiler-start-20260910
- Request fingerprint: 2ae644a868ca1537c2f27285aba8399428c41a3036aa4cd868afdb681d87a837
- Action: set_state
- Step ID: high-detail-profiler
- State: in_progress
- Evidence:
  - evt-dc7e7174-4783-4ef5-85ac-f4fe32dd15ff
  - DecalGeometry 34.6ms versus detached guard 11,585ms on 15,405-vertex Goose body

### evt-7fc8676e-79dc-4723-b74c-58365ed1e41c

- Timestamp: 2026-09-09T21:58:21.185Z
- Actor: Main
- Operation: execution_plan.update
- Prior revision: 27
- Resulting revision: 28
- Summary: Production-shaped profiling split completed: detached per-output-vertex guard dominated high-detail cost.
- Idempotency key: ABI-059-plan-profiler-complete-20260910
- Request fingerprint: e73d2e8b704b57ed7d0f667004c8a57b352af14b6114552674bde4d8c292f7c5
- Action: set_state
- Step ID: high-detail-profiler
- State: complete
- Evidence:
  - evt-f4beb0bc-caac-4eb3-8a62-04c5110e7543
  - evt-dc7e7174-4783-4ef5-85ac-f4fe32dd15ff
  - 15,405-vertex/33,168-index body: 34.6ms DecalGeometry versus 11,585.0ms detached guard

### evt-a648dc9a-26cf-499c-bf8b-81b86fbfc522

- Timestamp: 2026-09-09T21:58:28.339Z
- Actor: Main
- Operation: execution_plan.update
- Prior revision: 28
- Resulting revision: 29
- Summary: Reconciling completed bounded Goose high-detail guard fix before release closure.
- Idempotency key: ABI-059-plan-fix-start-20260910
- Request fingerprint: ae140b7aaa9db7b0f32193724e6b741893861f5d4b513abaea1e6f5fcd24dfc8
- Action: set_state
- Step ID: high-detail-fix
- State: in_progress
- Evidence:
  - evt-f4beb0bc-caac-4eb3-8a62-04c5110e7543
  - Goose-only bound preserves DecalGeometry output while bypassing detached guard work above 128 vertices

### evt-15aebad0-967d-4b24-bc0f-04120f4f4c34

- Timestamp: 2026-09-09T21:58:35.652Z
- Actor: Main
- Operation: execution_plan.update
- Prior revision: 29
- Resulting revision: 30
- Summary: Bounded Goose high-detail guard fix retested with visible decals, frame-budget success, lifecycle coverage, and documented cold-load limitation.
- Idempotency key: ABI-059-plan-fix-complete-20260910
- Request fingerprint: 9e3119e10e1438fcabc0344b1c53704826b4523a3c4ab497b681f89739c2f527
- Action: set_state
- Step ID: high-detail-fix
- State: complete
- Evidence:
  - evt-48cdc230-29ae-42a4-9958-35d6cca1f9eb
  - 8 visible/non-empty decals on 15,405-vertex body
  - 1,009 frames/7s p95 7.1ms, max 7.2ms, zero gaps >16.67ms
  - Cold GLB network/decode remains a documented limitation
