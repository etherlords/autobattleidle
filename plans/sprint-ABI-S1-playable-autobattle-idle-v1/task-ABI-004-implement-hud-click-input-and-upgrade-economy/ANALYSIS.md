---
plannerFormat: 1
id: ABI-004
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004 analysis

## Verified current state

- ABI-002 provides the pure deterministic `CombatState`, shared `attack` command, enemy spawning,
  automatic lock/cooldown rules, rewards, grades, and modifiers. Unit coverage is green.
- The browser application still owns an immutable placeholder `BattleSnapshot`; its frame loop only
  renders that snapshot. The DOM HUD is static, has `pointer-events: none`, and exposes no input,
  cooldown, event log, currency, or upgrades. This is the root cause of the deployed static page.
- ABI-004 is Ready, depends only on Done ABI-002, has no open dependency or foreign claim, and was
  selected explicitly by user priority ahead of ABI-003. `HEAD` and fetched `origin/main` were both
  `0df0c556ffb76e2facb1e9177198027fac111857` before implementation.
- Canonical Vault contracts are Combat Loop `AUTOBATTLEIDLE-DOC-20260827-584401`, Economy and Upgrade
  Curves `AUTOBATTLEIDLE-DOC-20260827-A798F2`, and UI, Persistence, and QA
  `AUTOBATTLEIDLE-DOC-20260827-85CBFC`.

## Approach

- Make one application-owned live combat session compose domain state, monotonic frame time, random
  rolls, rendering snapshots, and bounded presentation events. Manual input routes directly to the
  shared domain attack command; the frame scheduler alone issues due automatic attacks.
- Extend the presentation snapshot rather than giving UI or Three.js ownership of simulation state.
  Keep ABI-003 visual work out of scope.
- Add a small domain upgrade catalog/purchase operation for the five required paths with centralized
  balance constants, atomic cost checks, prerequisites, caps, and human-readable disabled reasons.
- Make the DOM HUD render the top enemy bar, countdown/lock state, currency, five upgrades, and bounded
  polite event log; keep pointer and keyboard activation exactly-once and remove every listener on
  disposal.

## Risks

- RequestAnimationFrame timestamps and command timestamps must share one clock origin or automatic
  attacks can fire early/late. Tests inject time and rolls.
- A kill replaces the enemy in the same command; event text must use the defeated enemy/reward from the
  result without issuing a second attack or reward.
- Click plus keyboard handlers can double-fire if attached at multiple layers. One interactive control
  owns both native activation paths; no global key listener is needed.
- Manual attacks must not mutate `nextAutomaticAttackAtMs`; automatic speed/elite slow must affect only
  the computed automatic interval.
- Replacing HUD children every frame would churn DOM and focus. Create stable elements/listeners once
  and update values/attributes in place.
- Deployed acceptance is not satisfied by load health: Pages QA must observe HP, cooldown, reward/log,
  upgrade, responsive, and disposal transitions.
