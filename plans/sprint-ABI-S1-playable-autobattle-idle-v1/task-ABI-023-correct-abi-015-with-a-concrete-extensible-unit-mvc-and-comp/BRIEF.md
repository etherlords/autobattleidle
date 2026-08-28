---
plannerFormat: 1
id: ABI-023
artifact: brief
project: ABI
profile: high-assurance
revision: 9
status: Ready for Manager
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

# ABI-023: Correct ABI-015 with a concrete extensible Unit MVC and component architecture

## Goal

Correct ABI-015 with a concrete extensible Unit MVC and component architecture

## Work item

- Type: bug
- Priority: critical
- Status: Ready for Manager

## Acceptance criteria

- [ ] Correct the failed ABI-015 acceptance explicitly: the production architecture provides concrete class/object-based Unit, Model, View, and Controller responsibilities rather than only file decomposition and functional registries.
- [ ] A shared runtime Unit/UnitView lifecycle is proven by at least the real player and enemy products; models remain serializable/domain-safe and Three.js resources remain view-owned.
- [ ] Typed commands and events route attack, damage, spawn/replacement, upgrade, animation, render, persistence, and disposal side effects at their responsible boundaries without a global event bus or duplicated mutable truth.
- [ ] Enemy creation uses an exhaustive factory and invariant builder; grade/modifier behavior uses composable model strategies/decorators; visual bodies and optional cues use independently attachable view components/decorators. Adding a family or modifier is compiler-guided and does not require branch-heavy construction edits.
- [ ] Upgrade definitions, display order, level/cost/can-advance/apply behavior, and command/event semantics have one compiler-complete extension path with no duplicated stat-level accessors.
- [ ] Feature-owned module directories separate units, models, views, controllers, commands, events, factories, builders, modifiers, configuration, and tests where each has real responsibility; src/game does not become a flat dumping ground.
- [ ] Installed TypeScript/ESLint/Prettier tooling enforces every syntactically reliable zero-baseline rule: strict named public contracts, dependency direction, root composition, nested ternaries, complexity/depth, unsafe assertions/any/indexed access, and explicit module boundaries. Non-enforceable semantic ownership remains tested and independently reviewed.
- [ ] Behavior is preserved exactly: deterministic rolls/results/arithmetic order, user-authored boss interval 35 and automatic minimum interval 100ms, event message/order semantics, HUD pointer/keyboard/modal/accessibility/listeners, visual seeds/cues/attachments/animations/framing/object counts/disposal, and current public facades.
- [ ] Persistence impact is no schema change; v1, current v2, historical cadence-15 v2, malformed-save recovery, save/reload, and deployed compatibility remain proven with no valid-progress reset.
- [ ] Fresh pnpm check passes before and after refactor; independent Reviewer finds no unresolved P0-P2; independent real-browser QA covers desktop and 390px, full visual family/grade/modifier matrix, attachment/clipping/animation intent, 120+ replacements/effects, save compatibility, and no focus/modal regression.
- [ ] Vault architecture documentation is corrected to make the concrete Unit/MVC/component contract canonical; Planner records the premature ABI-015 acceptance and the full corrective lifecycle.
- [ ] No ABI-016, ABI-010, ABI-012, ABI-014, ABI-017-022 gameplay implementation or rebalance is performed; only dependency safety updates needed to keep them behind this corrective task are allowed.

## Dependencies

- ABI-015

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260828-ECBD82
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-D1B235

## Constraints

- Follow the resolved workflow contract and project instructions.
