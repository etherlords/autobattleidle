---
plannerFormat: 1
id: ABI-022
artifact: qa
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

# ABI-022 qa

## Verdict

PASS — independent real-browser QA, supplementary functional proof, receipt readback, and post-repair cue/resource retest are complete.

## Evidence

- Completed in a real Chrome session: desktop 1440x900 and mobile 390x844 family x variant matrices, 24/24 cells at each viewport; old armor/health/automatic-slow captures; byte-identical deterministic reload receipts; historical V1 migration; hardened defeat transition; manual-guard keyboard and pointer exactly-one-hit behavior; clean console; no source/test/Planner/Vault/dependency mutation.
- Preserved receipts: 65 files under `.playwright-cli/abi-022/`; do not rerun the complete matrix.
- Missing browser acceptance: quantitative critical-guard critical-multiplier suppression, quantitative automatic-versus-manual modifier distinction, and fully demonstrated modifier cues at 390px. Domain tests support but cannot replace these required application transitions.
- Next action: one bounded supplementary real-browser pass using valid deterministic saves and measurable HP/event/timing evidence for only the missing transitions/cues. If the product cannot expose them deterministically, return the exact limitation rather than infer PASS.

## Supplementary result and receipt readback

- Functional gaps closed: Critical Guard flattened comparable browser damage from `36, 72 critical, 36` to `42, 42, 42`; Manual Guard reduced manual `42` to `21` while automatic noncritical `42` and random critical `84` events remained. Console error filter stayed clean.
- FAIL remains: direct readback of `mobile-cue-critical-guard.png` shows the Sentinel core clipping vertically through the HUD, battlefield, and viewport. `sentinelCore: [0.62, 0.82, 8]` is interpreted by `THREE.CylinderGeometry` as top radius 0.62, bottom radius 0.82, and height 8. Correct the authored geometry tuple and add a dimension/bounds regression before a fresh independent cue/resource recheck.
- Browser replacement/disposal/resource telemetry was not captured in the first run; focused QA must add bounded observable runtime evidence rather than infer it from screenshots.

## Final independent retest

- New independent review approved the Sentinel fix before retest. `final-critical-guard-390.png` and YAML readback show the corrected compact Sentinel and attached prism/guard cue at 390x844 with no clipping or HUD overlap.
- Uninterrupted in-app auto progression reached elite encounter 69 then boss encounter 70 over 13.08 seconds without reload. DOM nodes stayed 59, canvas stayed 1, and JS heap fluctuated from 16,793,956 to 17,756,260 bytes without monotonic runaway. Console error filter remained clean.
- Resource receipts: `final-resource-before.txt`, `final-resource-after.txt`, `final-resource-series.yml`, and `final-resource-series-settled.png`. Browser tooling does not expose listener/renderer internals; reviewed focused disposal and bounded-tree tests cover those owners.
- Consolidated functional evidence: hardened defeat/next reward, Critical Guard control `36/72 critical/36` versus guarded `42/42/42`, Manual Guard manual `42 -> 21` while automatic noncritical `42` remains, pointer/keyboard exactly-one hits, historical save migration/reload, deterministic reload, old modifiers, clean console/network, and both 24/24 viewport matrices.
