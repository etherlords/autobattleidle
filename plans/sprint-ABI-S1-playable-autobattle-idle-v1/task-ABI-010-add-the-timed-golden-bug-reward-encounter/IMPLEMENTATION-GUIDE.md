---
plannerFormat: 1
id: ABI-010
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-010 implementation-guide

## Frozen scope

- Persistence impact: **schema migration**. Save V3 stores canonical event identity/resume encounter but no absolute timer or Three.js/DOM data. Preserve V1, V2, and unversioned sources.
- Balance: event every 50 defeated progression encounters; 10,000 ms window; health factor 5 over maximum base automatic window damage; reward factor 10 over the resumed enemy's base reward; safe saturation everywhere.
- Reload: an active saved event restarts a full ten-second window at load. Ordinary encounter, player, coins, and automatic unlock/speed remain semantically unchanged.
- Acceptance layers: formulas/transitions/migrations are unit; controller/snapshot/HUD/view replacement are integration; real timing, auto-only failure, 10 Hz active-click success, reload, desktop/390px, and bounded cleanup are deployed.
- Non-goals: ABI-018 automatic-speed rebalance, ABI-011 rich effects, ABI-020 ordinary economy tuning, new dependencies, generalized event frameworks, or a HUD redesign.

## Implementation sequence

1. Extend named combat/save contracts and add pure Golden Bug spawn, deadline, timeout, reward, and resume helpers at the existing domain seams.
2. Route kill and frame-timeout through `BattleController` while preserving manual/automatic scheduling and one publish/persist/render update per transition.
3. Add snapshot event identity/deadline remainder and render one passive accessible countdown in the existing `BattleStatus`.
4. Register one compact Golden Bug visual composition through the existing enemy factory/builder lifecycle, with metallic gold highlights and a non-color silhouette/cue.
5. Add Save V3 codecs/validation plus V1 -> V2 -> V3 and V2 -> V3 migration fixtures; never store deadline timestamps.
6. Add focused deterministic domain/controller/snapshot/HUD/visual/persistence tests and a small timing-envelope simulator assertion, then run `pnpm check`.
7. Independent Reviewer checks transition ordering, safe arithmetic, migration retention, scope, and disposal. Independent QA proves the functional browser scenarios at desktop and 390px.

## Verification matrix

- Unit: exact encounter-50 spawn; no spawn elsewhere; kill/timeout resume the same next encounter; reward exactly once; timeout zero; safe rollover/saturation; automatic-only maximum remains below HP; 10 Hz manual envelope succeeds.
- Persistence: V1 and V2 migrate to V3; active V3 reload restarts ten seconds; inactive/progression saves are unchanged semantically; source slots survive; malformed/future data recovers safely.
- Integration: deadline wins at equality; stale attack ignored; manual attacks never reset automatic cooldown; snapshot countdown reaches zero; passive HUD does not accept attack input; enemy replacement/disposal stays bounded.
- Browser local/deployed: observe event spawn, auto-only escape, active-click kill and 10x reward, ordinary/boss continuation, reload rule, metallic plus non-color cue, desktop 1440x900 and 390x844, clean console/network, stable DOM/canvas/resources.
- Delivery: focused tests and `pnpm check`, independent review, independent QA, Vault accepted-rule sync, actor-separated verification/manager gates, coherent native-hook commit/push, exact-SHA CI/Pages and public functional proof.
