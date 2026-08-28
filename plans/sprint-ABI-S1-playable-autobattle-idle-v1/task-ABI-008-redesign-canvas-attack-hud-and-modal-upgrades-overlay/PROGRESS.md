---
plannerFormat: 1
id: ABI-008
artifact: progress
project: ABI
profile: high-assurance
revision: 2
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
- Revision: 2
- Last update: Priority lowered critical to high so ABI-013 is next. planner_task_update committed revision 3 but duplicated structured values; after healthy doctor/no recovery, Manager used an exact BRIEF-only Markdown fallback. Before SHA-256 B842ED8797A0D905BABCD46FC58AB01D39F5BF157718FC956CBFD95DBFFEAFE9; after 5B7A78D1182783004BFF197BC007EF4914514546E82143D85E66C9AC2F4D128F. Planner bounded readback confirms one authoritative set: 7 criteria, dependencies ABI-004/ABI-005, related Vault IDs 85CBFC/584401/A7F881. One rejected no-op readback requested maxCharsPerArtifact=12000 above the 6000 limit; retry at 6000 succeeded.

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

### evt-e5c6078f-b9bd-4812-80ef-140315258d35

- Timestamp: 2026-08-28T14:16:30.808Z
- Actor: Manager
- Operation: progress.append
- Prior revision: 1
- Resulting revision: 2
- Summary: Priority lowered critical to high so ABI-013 is next. planner_task_update committed revision 3 but duplicated structured values; after healthy doctor/no recovery, Manager used an exact BRIEF-only Markdown fallback. Before SHA-256 B842ED8797A0D905BABCD46FC58AB01D39F5BF157718FC956CBFD95DBFFEAFE9; after 5B7A78D1182783004BFF197BC007EF4914514546E82143D85E66C9AC2F4D128F. Planner bounded readback confirms one authoritative set: 7 criteria, dependencies ABI-004/ABI-005, related Vault IDs 85CBFC/584401/A7F881. One rejected no-op readback requested maxCharsPerArtifact=12000 above the 6000 limit; retry at 6000 succeeded.
- Idempotency key: abi-008-priority-normalization-fallback-v1
- Evidence:
  - planner://work-item/ABI-008/artifact/BRIEF.md
  - planner_doctor healthy; recovery.required=false
  - before:B842ED8797A0D905BABCD46FC58AB01D39F5BF157718FC956CBFD95DBFFEAFE9
  - after:5B7A78D1182783004BFF197BC007EF4914514546E82143D85E66C9AC2F4D128F
