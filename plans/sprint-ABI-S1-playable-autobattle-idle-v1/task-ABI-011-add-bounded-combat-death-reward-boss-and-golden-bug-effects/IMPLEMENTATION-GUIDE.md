---
plannerFormat: 1
id: ABI-011
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-009
  - ABI-010
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-011 implementation-guide

## Frozen scope

- Only ABI-011 presentation behavior. Do not change damage, armor, critical, reward, cooldown,
  progression, balance, save schemas, ABI-019 or blocked ABI-020.
- Reuse `BattleControllerEvent -> presentBattleUpdate -> BattleSnapshot -> Battlefield` and the existing
  capped effect lifecycle. No package, asset pipeline, parallel state owner or speculative effect system.
- Required readable cues: ordinary hit, armored hit, critical hit, ordinary death, coin reward, stronger
  boss transition, Golden Bug kill and Golden Bug escape. Identity must not rely only on color.
- Maximum active effects remains 12; every retired effect disposes geometry/material exactly once.
- Reduced-motion mode retains readable static/short cues and suppresses growth/translation.

## Implementation sequence

1. Preserve one subscribed controller event through `startApplication` and add immutable visual cues to
   the presentation snapshot; initial and idle renders contain none.
2. Map attack/escape outcomes with pre-transition enemy identity: ordinary versus armored versus
   critical, death plus awarded coin reward, boss transition, Golden Bug kill, Golden Bug escape.
3. Extend the existing effect config/factory with the minimum distinct built-in Three.js geometries and
   reuse cap, expiry, scene ownership and disposal.
4. Add focused mapping/lifetime/reduced-motion/disposal regressions, then run `pnpm check`.
5. Independent Reviewer audits boundaries and leaks; independent browser QA proves desktop/narrow and
   reduced-motion behavior; Manager updates canonical Vault evidence and performs closure/publication.

## Verification matrix

- **Unit:** exact event-to-cue sequences; ordinary/armor/critical non-color distinction; reward alignment;
  boss and Golden Bug identities; cap/eviction/expiry/reduced-motion; idempotent geometry/material disposal.
- **Integration:** controller event is rendered once; idle frames do not replay it; HUD log and near-enemy
  reward cue derive from the same outcome; presentation never mutates state.
- **Persistence:** no schema change; canonical `pnpm check` must keep current, V1, V2, legacy and malformed
  save tests green through load/save/reload behavior.
- **Deployed:** at desktop and 390x844, exercise ordinary/armored/critical hits, ordinary/boss death,
  reward, Golden Bug kill/escape and reduced motion; record URL, actions, visible result, console/network,
  long-run bounds, exact commit and Pages deployment.
