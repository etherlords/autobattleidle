---
plannerFormat: 1
id: ABI-018
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018 implementation-guide

## Frozen scope

- ABI-018 only: automatic APS/interval formula, immutable current-stat snapshot values, compact modal rendering, focused regressions, accepted Vault formula text, and release evidence.
- Preserve upgrade costs, damage/penetration/critical/double-reward formulas, rolls, rewards, manual attacks, encounter/boss rules, save schema V3, and ABI-011/014/016/019/020 scope.
- No dependency, new abstraction, redesign, or persistence-shape change.

## Implementation sequence

1. Add centralized APS constants and a safe `automaticAttacksPerSecond(level)` helper; make `automaticInterval` reuse it and retain elite slow semantics.
2. Add named derived player stats to `BattleSnapshot` from existing formula helpers.
3. Add one semantic current-stats panel to the existing upgrade dialog and minimal responsive CSS only if needed.
4. Add the smallest focused domain, snapshot/HUD, persistence, slow-modifier, and progression regressions; update only changed deterministic reference values.
5. Run focused tests and `pnpm check`, then independent review and browser QA before Manager closure.

## Verification matrix

- Unit: levels 0, 1, 10, 50, 100, 200, 500, 1000; finite, strictly increasing APS below 3; unchanged penetration/critical/double-reward values; elite interval delta exactly 500 ms.
- Integration: snapshot values equal domain helpers; dialog exposes damage, penetration %, critical %, double reward %, and APS; historical V1/V2/current load -> save -> reload preserves canonical progress.
- Progression: fresh starter remains ten manual hits at base damage; deterministic multi-boss report remains finite under the slower curve; Golden Bug and non-automatic semantics remain covered.
- Deployed: desktop and 390px modal layout/accessibility, visible per-upgrade APS change, cooldown/slow behavior, reload continuity, clean console, exact-SHA CI and Pages.
