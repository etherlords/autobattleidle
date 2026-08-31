---
plannerFormat: 1
id: ABI-028
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-028 analysis

## Complexity and ownership

- **Complexity: XL.** This is a balance-model change, not a single health-constant fix. It spans the production encounter path, exact/event-jump simulation, upgrade trajectories, rewards, historical saves, browser observability, and measured product approval.
- ABI-028 owns ordinary-enemy TTK composition only. ABI-020 remains the elapsed-time/economy baseline; ABI-029 must consume ABI-028's final composition envelope instead of retuning affinity modifiers independently; ABI-039 owns boss cadence and identity scheduling.
- Keep this task separate from ABI-029: combining balance diagnosis with 96+ visual/stat combinations would make regressions impossible to attribute. The reuse point is the frozen TTK-band contract and shared simulator telemetry.

## Verified current state

- ABI-020 owns the production-path exact/event-jump simulator, elapsed-time stages, upgrade economics, high-APS batching, ordinary/boss/Golden telemetry, and the accepted long-run envelope. ABI-028 must extend that harness rather than create a second balance simulator.
- Current ordinary variety is composed from centralized health growth, grades, family profiles, modifiers, and deterministic encounter selection. The reported symptom can therefore come from composition or reachable player damage, not necessarily from one base-health constant.
- Boss and Golden Bug identities have separate formulas and timing. They are explicit exclusions from ordinary TTK-band tuning.
- Persistence impact is provisionally **no schema change** because the intended model derives encounter identity from existing canonical inputs. Current and V1-V4 migrated saves still require load -> simulate -> save -> reload proof.

## Approach

- Freeze ABI-020's final reference builds, elapsed-time bands, and reward constraints, then measure manual-only, automatic-only, and combined TTK for ordinary encounters across early, mid, late, and long-run stages.
- Diagnose the narrowest shared owner responsible for collapsed variety. Compare a bounded set of health, grade, modifier, family, or encounter-mix candidates in the existing simulator before changing production code.
- Select one candidate that deliberately yields fast, medium, and durable ordinary encounters without invalidating ABI-020 progression, rewards, upgrade usefulness, safe-number behavior, or endless progression.
- Publish the selected thresholds as an input contract for ABI-029 so affinity stat modifiers are measured against the final ordinary composition once.

## Risks

- Tuning against one build can create walls or trivial encounters for manual-only, auto-only, old-save, or high-APS cohorts. The matrix must cover all accepted reference trajectories.
- Family or affinity stats added later can collapse the bands again. ABI-029 is now downstream and must treat these bands as a hard envelope.
- Browser screenshots cannot prove distribution. Headless receipts prove the model; deterministic browser fixtures prove the resulting experience is observable.
- Broad reward compensation can hide a bad health model. Reject candidates that require unrelated economy changes.
