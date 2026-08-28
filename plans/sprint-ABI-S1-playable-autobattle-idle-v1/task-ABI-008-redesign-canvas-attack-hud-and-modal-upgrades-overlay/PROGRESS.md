---
plannerFormat: 1
id: ABI-008
artifact: progress
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008 progress

## Current state

- Status: Ready
- Revision: 1
- Last update: Bootstrapped

## Execution plan

- [ ] ui-preflight: Manager: reconcile HUD/input Vault contract, current canvas/HUD/CSS ownership, responsive risks, and unit/integration/deployed acceptance
- [ ] canvas-input: Implementation owner: route pointer attacks through the battlefield canvas and preserve exactly-once Enter/Space input without modal click-through
- [ ] passive-hud: Implementation owner: build the fixed passive name/full-width HP/35-45% auto/coins overlay with accessible values and no pointer or selection behavior
- [ ] fixed-log-layout: Implementation owner: pin the bounded log lower-right, constrain the viewport, and eliminate document reflow and page scrollbars
- [ ] upgrade-modal: Implementation owner: replace always-visible upgrades with a lower-left launcher and accessible fixed modal with focus restore, Escape and disabled reasons
- [ ] ui-tests: Implementation owner: add exactly-once input, passive overlay, modal lifecycle, no-click-through and disposal tests; run focused tests and pnpm check
- [ ] independent-gates: Independent Reviewer and QA: audit ownership/accessibility and prove real pointer/keyboard/modal behavior at desktop and 390px narrow viewports
- [ ] ui-delivery: Manager: verify evidence, commit/push, wait CI/Pages, repeat deployed layout/input scenarios, and close

## Events

_No progress events recorded._
