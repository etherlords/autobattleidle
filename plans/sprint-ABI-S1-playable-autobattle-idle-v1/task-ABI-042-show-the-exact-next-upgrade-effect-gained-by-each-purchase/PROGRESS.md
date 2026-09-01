---
plannerFormat: 1
id: ABI-042
artifact: progress
project: ABI
profile: high-assurance
revision: 20
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-017
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-042 progress

## Current state

- Status: In QA
- Revision: 20
- Last update: Independent review passed; advance the exact bounded candidate to deployed acceptance QA.

## Execution plan

- [x] delta-contract: Map each upgrade to its shared next-effective-level and derived-stat delta
- [x] delta-ui: Render readable visual and accessible deltas in existing upgrade rows
- [x] delta-tests: Cover normal, multi-level skip, restored, disabled, desktop, and narrow cases
- [x] independent-review: Independently review formula ownership and accessibility
- [~] independent-qa: Verify deployed purchase previews and resulting stats
- [ ] manager-close: Publish exact-SHA evidence and close

## Events

### evt-dc4dfa6f-22ba-492b-9579-0610f0ec4210

- Timestamp: 2026-09-01T03:51:05.436Z
- Actor: codex-root
- Operation: claim.acquire
- Prior revision: 1
- Resulting revision: 2
- Summary: Claimed task lease: JIT preflight, implement exact next-upgrade deltas, independent review and deployed QA
- Idempotency key: abi042-claim-codex-root-20260901
- Request fingerprint: c1180b66c77f449924543bbf2106b3f18f89704bc2d3cdd848672fec920306f5
- Agent ID: codex-root
- Session ID: abi-s1-continuation-20260901
- Intent: JIT preflight, implement exact next-upgrade deltas, independent review and deployed QA
- Branch: continue-abis1-after-visual-families
- Expires at: 2026-09-01T04:51:05.436Z
- Evidence:
  - None

### evt-a2e49dc2-e948-48bd-a24b-ee4b794ed0b3

- Timestamp: 2026-09-01T03:52:45.254Z
- Actor: codex-root
- Operation: progress.append
- Prior revision: 2
- Resulting revision: 3
- Summary: Recorded the manager-owned ANALYSIS and IMPLEMENTATION-GUIDE narrow Markdown fallback after tracing the existing next-effective-level, presenter, snapshot, and HUD path.
- Idempotency key: abi042-preflight-markdown-fallback-20260901
- Evidence:
  - ANALYSIS.md
  - IMPLEMENTATION-GUIDE.md
  - AUTOBATTLEIDLE-DOC-20260827-A798F2 contentHash e17c62df96d32cb9da2312731a577aa43c23496d389dab6c366e16750a45c38a
  - src/domain/combat/upgrades.ts
  - src/app/battle/presenter.ts
  - src/ui/hud/upgrade-dialog.ts

### evt-f55a145f-32e3-45da-a502-0a17e97eb01c

- Timestamp: 2026-09-01T03:52:47.103Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 3
- Resulting revision: 4
- Summary: Start the domain-owned next-effective-level preview contract.
- Idempotency key: abi042-start-delta-contract-20260901
- Request fingerprint: f88414719e38ad5dc9d9e914f526da8851b041f211d84d14084d947a9ebd3b0e
- Action: set_state
- Step ID: delta-contract
- State: in_progress
- Evidence:
  - existing nextUpgradeLevel is authoritative
  - no schema change
  - unit/integration/deployed acceptance classified

### evt-8b53ca86-2a39-437a-952f-12d49492413c

- Timestamp: 2026-09-01T03:52:48.004Z
- Actor: codex-root
- Operation: progress.append
- Prior revision: 4
- Resulting revision: 5
- Summary: EVENT preflight-ready — codex-root — Scope, authoritative formula owner, risks, no-schema persistence boundary, acceptance layers, file ownership, and managed implementation order are frozen.
- Idempotency key: abi042-preflight-ready-20260901
- Evidence:
  - BRIEF.md
  - ANALYSIS.md
  - IMPLEMENTATION-GUIDE.md
  - execution-plan:delta-contract=in-progress
  - dependencies ABI-017 and ABI-018 Done

### evt-9c60ef61-c977-48fa-8819-2851c632b4ce

- Timestamp: 2026-09-01T03:53:00.314Z
- Actor: codex-root
- Operation: task.advance
- Prior revision: 5
- Resulting revision: 6
- Summary: JIT preflight is complete; authorize bounded implementation of the existing domain-to-HUD preview path.
- Idempotency key: abi042-advance-in-progress-20260901
- Request fingerprint: 15d68515a3e4292da05826e2e825098e2a868a7384b05b7c912cdb7ba8c268eb
- From status: Ready
- To status: In Progress
- Evidence:
  - preflight-ready evt-8b53ca86-2a39-437a-952f-12d49492413c
  - execution-plan:delta-contract=in-progress
  - dependencies ABI-017 and ABI-018 Done
  - Vault AUTOBATTLEIDLE-DOC-20260827-A798F2

### evt-f92705f0-b6be-422a-a494-cd400b97757b

- Timestamp: 2026-09-01T04:08:56.119Z
- Actor: abi042_implementation_v1
- Operation: progress.append
- Prior revision: 6
- Resulting revision: 7
- Summary: EVENT checkpoint — abi042_implementation_v1 — Exact next-purchase preview flows from the authoritative selector to accessible upgrade cards; unaffordable rows retain gain plus disabled reason; focused and full checks pass.
- Idempotency key: abi042-implementation-checkpoint-v1-20260901
- Evidence:
  - src/domain/combat/upgrades.ts: upgradeEffectPreview reuses nextUpgradeLevel and displayedValue
  - src/app/battle/presenter.ts: enabled and affordability-only projections
  - src/ui/hud/upgrade-dialog.ts: visible and exact accessible effect copy
  - focused 52/52 PASS
  - pnpm check 20 files 192/192 PASS
  - git diff --check PASS

### evt-f1520825-b198-4ec7-87f4-559282f7b6ac

- Timestamp: 2026-09-01T04:09:10.624Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 7
- Resulting revision: 8
- Summary: The domain preview reuses the exact next-effective-level selector and displayed quantum.
- Idempotency key: abi042-complete-delta-contract-20260901
- Request fingerprint: db7fac6dfd1ee428a4cfa395ea6db893ff83384c4e694d3d0c277009c4935d39
- Action: set_state
- Step ID: delta-contract
- State: complete
- Evidence:
  - evt-f92705f0-b6be-422a-a494-cd400b97757b
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-ff72437e-ceb4-409c-ad8f-3d5712aaa9ea

- Timestamp: 2026-09-01T04:09:11.846Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 8
- Resulting revision: 9
- Summary: Project and render the domain preview through the existing snapshot and upgrade cards.
- Idempotency key: abi042-start-delta-ui-20260901
- Request fingerprint: 1cdda3b7c0219de4deabb629dc5b6ceff4fa14aec96b3d2ce6c00e1c9c75e2d8
- Action: set_state
- Step ID: delta-ui
- State: in_progress
- Evidence:
  - evt-f92705f0-b6be-422a-a494-cd400b97757b
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-597fe781-3513-4283-864a-a001c3409299

- Timestamp: 2026-09-01T04:09:13.319Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 9
- Resulting revision: 10
- Summary: Upgrade cards now show compact gain copy and exact accessible copy without hiding affordability reasons.
- Idempotency key: abi042-complete-delta-ui-20260901
- Request fingerprint: 05d1dc1ff00ab25e1e0ad6654aa14a112f1594f15566a501909d51fc3ecb9f33
- Action: set_state
- Step ID: delta-ui
- State: complete
- Evidence:
  - evt-f92705f0-b6be-422a-a494-cd400b97757b
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-e18a7e6a-1be4-42ed-ba98-2cbef840fad9

- Timestamp: 2026-09-01T04:09:15.141Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 10
- Resulting revision: 11
- Summary: Run focused and full regressions for previews, skips, endpoints, restored snapshots, accessibility, and layout.
- Idempotency key: abi042-start-delta-tests-20260901
- Request fingerprint: 54f01e03bc624abeb364effe2585a1aa828bb1d4f003158ada0335613b03f9c7
- Action: set_state
- Step ID: delta-tests
- State: in_progress
- Evidence:
  - evt-f92705f0-b6be-422a-a494-cd400b97757b
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-1c7ea092-eae4-4c88-bfa7-9a79863991f8

- Timestamp: 2026-09-01T04:09:16.755Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 11
- Resulting revision: 12
- Summary: Focused 52/52 and full pnpm check 192/192 pass with lint, format, typecheck, build, and diff check.
- Idempotency key: abi042-complete-delta-tests-20260901
- Request fingerprint: d2565287b644b7e24c71e213e6df58921454c4795def20a1ac80037ee2e129b3
- Action: set_state
- Step ID: delta-tests
- State: complete
- Evidence:
  - evt-f92705f0-b6be-422a-a494-cd400b97757b
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-eaa19f62-bd36-49a4-956c-eae665d2b478

- Timestamp: 2026-09-01T04:09:34.135Z
- Actor: abi042_implementation_v1
- Operation: gate.record
- Prior revision: 12
- Resulting revision: 13
- Summary: Implementation self-check passes for the bounded domain-to-accessible-card preview path.
- Idempotency key: abi042-implementation-self-check-pass-20260901
- Request fingerprint: 71f91b0f7558dd78ea98d6f04b26c8a665e3f3ed7f37177f20afd1199eb51003
- Gate: implementation-self-check
- Verdict: pass
- Evidence:
  - focused 52/52 PASS
  - pnpm check 20 files 192/192 PASS
  - lint PASS
  - format PASS
  - worker typecheck PASS
  - production build PASS
  - git diff --check PASS

### evt-da63d401-6d61-4add-ad3c-5ad761e55d6c

- Timestamp: 2026-09-01T04:09:35.375Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 13
- Resulting revision: 14
- Summary: Start independent review of formula ownership, affordability semantics, exact accessibility, and regression coverage.
- Idempotency key: abi042-start-independent-review-20260901
- Request fingerprint: a414c13b7b362386cc9b9cde0293b1bd8f69ae1b34e243ab9fe43aefecc6a0b9
- Action: set_state
- Step ID: independent-review
- State: in_progress
- Evidence:
  - planner-gate:implementation-self-check=pass
  - focused 52/52 PASS
  - pnpm check 192/192 PASS

### evt-86debb13-def3-49d5-83bf-1ad94cf85b2d

- Timestamp: 2026-09-01T04:09:36.354Z
- Actor: codex-root
- Operation: task.advance
- Prior revision: 14
- Resulting revision: 15
- Summary: Bounded implementation and self-check passed; hand off to an independent reviewer.
- Idempotency key: abi042-advance-in-review-20260901
- Request fingerprint: 4e3af034a0fd22d7a375bddef419e189de9216d39c5f2b82bd255cdd5abd6c98
- From status: In Progress
- To status: In Review
- Evidence:
  - planner-gate:implementation-self-check=pass
  - execution-plan:independent-review=in-progress
  - evt-f92705f0-b6be-422a-a494-cd400b97757b

### evt-7208fd62-6e09-4df7-9dd2-c1c4532722dc

- Timestamp: 2026-09-01T04:14:51.386Z
- Actor: codex-root
- Operation: progress.append
- Prior revision: 15
- Resulting revision: 16
- Summary: Recorded the independent APPROVE verdict in REVIEW.md through the documented narrow Markdown fallback after healthy Planner doctor readback.
- Idempotency key: abi042-review-markdown-fallback-20260901
- Evidence:
  - REVIEW.md
  - abi042_independent_review_v1: APPROVE, no P0-P3
  - focused 52/52 PASS
  - git diff --check PASS
  - planner_doctor healthy; recovery not required

### evt-67daf139-39fc-4eeb-ae5b-620536785ad6

- Timestamp: 2026-09-01T04:14:58.249Z
- Actor: abi042_independent_review_v1
- Operation: gate.record
- Prior revision: 16
- Resulting revision: 17
- Summary: Independent review APPROVE: no P0-P3 findings; formula ownership, skipped-level delta, disabled semantics, accessibility, and layout risk verified.
- Idempotency key: abi042-independent-review-pass-v1-20260901
- Request fingerprint: 5d4436473c8db5fc70fe76a90965835f3544245558bc7929ec7e375fe1c34eb4
- Gate: independent-review
- Verdict: pass
- Evidence:
  - REVIEW.md
  - focused 52/52 PASS
  - git diff --check PASS
  - read-only independent review

### evt-eb862cde-7da5-4d86-8742-64749fb24f55

- Timestamp: 2026-09-01T04:15:10.709Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 17
- Resulting revision: 18
- Summary: Independent reviewer approved the bounded implementation with no P0-P3 findings.
- Idempotency key: abi042-complete-independent-review-20260901
- Request fingerprint: 3478959d5e7414bd90ecaee0f3e4ea914f750ff4d7de3dc2cc91b609f49c6623
- Action: set_state
- Step ID: independent-review
- State: complete
- Evidence:
  - evt-67daf139-39fc-4eeb-ae5b-620536785ad6
  - REVIEW.md
  - focused 52/52 PASS

### evt-94840b2f-5b4d-4947-bf97-38095dc8988d

- Timestamp: 2026-09-01T04:15:18.307Z
- Actor: codex-root
- Operation: execution_plan.update
- Prior revision: 18
- Resulting revision: 19
- Summary: Prepare an ABI-042-only release candidate and verify it on deployed desktop and narrow layouts.
- Idempotency key: abi042-start-independent-qa-20260901
- Request fingerprint: 5346a83d860ef6e3fe1dd448f602b9db78dc67f4543a5300bb6cef7e9364e2f4
- Action: set_state
- Step ID: independent-qa
- State: in_progress
- Evidence:
  - independent-review PASS
  - no schema change; historical-save regression remains required
  - deployed behavior acceptance

### evt-b7c61193-ca1b-4807-a865-86d7012050b7

- Timestamp: 2026-09-01T04:15:30.833Z
- Actor: codex-root
- Operation: task.advance
- Prior revision: 19
- Resulting revision: 20
- Summary: Independent review passed; advance the exact bounded candidate to deployed acceptance QA.
- Idempotency key: abi042-advance-in-qa-20260901
- Request fingerprint: 553dc9e9d00cdd950b24bf93c59f58460110739f85add82df0480b23bcdf846d
- From status: In Review
- To status: In QA
- Evidence:
  - independent-review gate evt-67daf139-39fc-4eeb-ae5b-620536785ad6
  - execution-plan:independent-qa=in-progress
  - REVIEW.md
