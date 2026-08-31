---
plannerFormat: 1
id: ABI-035
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-020
  - ABI-023
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-035 analysis

## Complexity and ownership

- **Complexity: L.** The code delta should stay narrow, but correctness crosses every cue producer/consumer, ABI-020 packet semantics, low-to-10+ APS timing, lethal sequencing, reduced motion, browser frames, and future audio consumption.
- ABI-035 owns the typed attack-source/timing receipt once. ABI-034 consumes that receipt for SFX mapping; it must not rediscover manual versus automatic attacks.
- Keep it separate from ABI-034 because the visual contract can close and be regression-tested without binary assets, rights approval, autoplay, or audio persistence.

## Verified current state

- `BattleController.performAttack` and the automatic frame path still know `AttackSource`, and `presenter.ts` uses it for log text. The transport then collapses presentation into `BattleSnapshot.visualCues`, where an attack is represented only by effect kind. Battlefield effects therefore cannot distinguish a fast manual click from an APS-driven automatic visual.
- ABI-020 raises effective automatic throughput above 10 APS while intentionally capping visible attack ticks near 3 Hz. This separates combat packet truth from presentation cadence; animating every packet would spam effects, while one fixed duration makes low APS sluggish or high APS overlap.
- ABI-031 already established fixed slash trajectories, distinct critical/armor cues, hit pause before death, semantic attachment sockets, reduced-motion handling, and bounded effect disposal. This task must extend that accepted system, not redesign it.
- Persistence impact is **no schema change**. Attack source, packet aggregation, cue timing, and effect phase are transient event/presentation data.

## Approach

- Replace the lossy effect-kind element with the smallest named cue object needed by all consumers: semantic kind, source for attack cues, aggregate packet count/fraction receipt if ABI-020 exposes it, and timing class or timestamp. Keep non-attack cues compact and exhaustive.
- Derive animation duration from the accepted visible cadence, not raw packet count. Manual remains a short authored duration. Automatic duration is clamped so low APS shows wind-up/impact/retire and high APS cannot overlap beyond the bounded effect cap.
- Preserve controller event order and lethal sequencing. Timing changes only drive Three.js effect phases; they never schedule domain attacks or decide damage/reward.
- Reuse existing effect construction/advance/retire owners and unit animation commands. Do not introduce another RAF, timer, global animation manager, or saved presentation state.

## Risks

- Adding source only to one caller recreates the loss at automatic/batched or lethal paths. Trace every creator and consumer of `visualCues` and exhaustively test manual, automatic, critical, armor, lethal, replacement, and Golden paths.
- Raw APS-to-duration mapping can approach zero or produce overlapping invisible objects. Clamp named phases and assert retirement no later than invisibility.
- Aggregation can accidentally change semantic counts or critical identity. Keep combat packets authoritative; presentation receives a receipt only.
- ABI-020 is still active. Remain Blocked until its final packet/cadence contract is closed, then refresh this analysis against the published implementation.
