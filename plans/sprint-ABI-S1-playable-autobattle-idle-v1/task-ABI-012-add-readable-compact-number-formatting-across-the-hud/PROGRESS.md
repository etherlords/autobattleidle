---
plannerFormat: 1
id: ABI-012
artifact: progress
project: ABI
profile: high-assurance
revision: 33
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-012 progress

## Current state

- Status: Done
- Revision: 33
- Last update: Released task claim: Release completed ABI-012 finite manager lease

## Execution plan

- [x] number-preflight: Manager: reconcile HUD ownership, numeric safety, ABI-008 layout state, formatter reuse, and unit/integration/deployed acceptance.
- [x] formatter: Implementation owner: add the minimum shared explicit-suffix formatter with exact-value companion and safe invalid fallback.
- [x] hud-integration: Implementation owner: route HP, damage, mitigation, rewards, coins, costs, and numeric logs through the shared formatter without changing timers or saved values.
- [x] number-tests: Implementation owner: add boundary, promotion, invalid-value, accessibility, and narrow-layout regression coverage; run pnpm check.
- [x] number-gates: Independent Reviewer and QA: audit shared ownership and verify exact/compact transitions, ARIA values, logs, persistence neutrality, desktop and 390px behavior.
- [x] number-delivery: Manager: verify evidence, commit/push, wait CI/Pages, repeat deployed number-format scenarios, and close.

## Events

### evt-dbb53371-e5ce-4072-9a59-45b18cab48f0

- Timestamp: 2026-08-28T23:37:23.529Z
- Actor: root-manager
- Operation: task.advance
- Prior revision: 1
- Resulting revision: 2
- Summary: Reconcile lifecycle after ABI-023 completion: all declared dependencies are Done; move ABI-012 from Blocked to Ready.
- Idempotency key: abi-s1-post-023-ready-abi-012-20260829
- Request fingerprint: 9e75117f1280fe2b92315c6025da4c4ea8b0f2eb80da9e531a3e68ff81045352
- From status: Blocked
- To status: Ready
- Evidence:
  - ABI-023 Done revision 10
  - canonical openDependencies=[]
  - planner_doctor healthy; recovery.required=false

### evt-a07ccd06-44ec-4c54-845a-452d05d9a6b4

- Timestamp: 2026-08-28T23:38:06.632Z
- Actor: root-manager
- Operation: claim.acquire
- Prior revision: 2
- Resulting revision: 3
- Summary: Claimed task lease: Execute exactly ABI-012 through JIT preflight, minimal implementation, independent review/QA, Vault sync, publication, and final audit
- Idempotency key: abi-012-claim-root-manager-20260829
- Request fingerprint: cff940e33afdeb80b9e288c82fb8ac1ca1b5bc793848b7972c95dc3a21293ffb
- Agent ID: root-manager
- Session ID: abi-s1-manager-20260829
- Intent: Execute exactly ABI-012 through JIT preflight, minimal implementation, independent review/QA, Vault sync, publication, and final audit
- Branch: main
- Expires at: 2026-08-29T01:38:06.632Z
- Evidence:
  - None

### evt-af1df608-e693-4f4b-8950-d9c179bb4260

- Timestamp: 2026-08-28T23:39:31.718Z
- Actor: root-manager
- Operation: progress.append
- Prior revision: 3
- Resulting revision: 4
- Summary: EVENT checkpoint — root-manager — recorded the required narrow Markdown fallback for manager-owned ANALYSIS and IMPLEMENTATION-GUIDE after healthy Planner doctor and bounded code/Vault preflight.
- Idempotency key: abi-012-preflight-fallback-record-20260829
- Evidence:
  - planner_get_execution_context ABI-012 revision 5
  - Vault AUTOBATTLEIDLE-DOC-20260828-C8B5AA contentHash d474eecce80220699b1a10534879b293303b82752f45f2dbc8f86f0f30ed8476
  - src/ui/hud.ts; src/ui/hud/battle-status.ts; src/ui/hud/upgrade-dialog.ts; src/app/battle/presenter.ts
  - ANALYSIS.md and IMPLEMENTATION-GUIDE.md narrow fallback

### evt-4a0057a8-3f04-430b-a8be-a035969f6736

- Timestamp: 2026-08-28T23:39:33.274Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 4
- Resulting revision: 5
- Summary: Start JIT number-formatting preflight.
- Idempotency key: abi-012-plan-preflight-start-20260829
- Request fingerprint: 6528b7ac485c70cb5a990792d8922e3e73d2a9845ed95002835c5c2d229ce035
- Action: set_state
- Step ID: number-preflight
- State: in_progress
- Evidence:
  - ABI-012 BRIEF revision 5
  - ANALYSIS.md
  - IMPLEMENTATION-GUIDE.md
  - AUTOBATTLEIDLE-DOC-20260828-C8B5AA

### evt-021654fb-9d10-451a-bbfc-be9fc402b329

- Timestamp: 2026-08-28T23:39:34.527Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 5
- Resulting revision: 6
- Summary: Complete JIT preflight with frozen ownership, acceptance layers, persistence boundary, and minimal implementation sequence.
- Idempotency key: abi-012-plan-preflight-complete-20260829
- Request fingerprint: 95bac406726287157b44d7e613f0a97940c35c2a7f8fd69352f880a9eea22899
- Action: set_state
- Step ID: number-preflight
- State: complete
- Evidence:
  - Acceptance classified unit/integration/deployed
  - Persistence impact: no schema change; historical v1/v2 reload remains required
  - COMBAT_BALANCE unchanged

### evt-fd79bdc1-36b4-4107-8cff-56885e8c1966

- Timestamp: 2026-08-28T23:39:35.611Z
- Actor: root-manager
- Operation: progress.append
- Prior revision: 6
- Resulting revision: 7
- Summary: EVENT preflight-ready — root-manager — ABI-012 scope, owners, risks, acceptance layers, persistence regression, and managed plan are frozen for one bounded implementation.
- Idempotency key: abi-012-preflight-ready-20260829
- Evidence:
  - All ABI-012 dependencies Done
  - Lease root-manager/abi-s1-manager-20260829
  - Managed number-preflight step complete
  - No schema change; no COMBAT_BALANCE change

### evt-27f678d6-c953-491a-8407-01e2de5774a8

- Timestamp: 2026-08-28T23:39:43.944Z
- Actor: root-manager
- Operation: task.advance
- Prior revision: 7
- Resulting revision: 8
- Summary: Begin exactly ABI-012 after completed JIT preflight and managed-plan evidence.
- Idempotency key: abi-012-ready-to-in-progress-20260829
- Request fingerprint: fc96c6cbabcac816a968211943b17ee441b08f0291e7ff4d8cf495aee5fb8f2a
- From status: Ready
- To status: In Progress
- Evidence:
  - EVENT preflight-ready revision 7
  - Managed number-preflight complete
  - Lease root-manager/abi-s1-manager-20260829
  - All dependencies Done

### evt-d7731355-8104-449f-807c-291f14825240

- Timestamp: 2026-08-28T23:39:57.228Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 8
- Resulting revision: 9
- Summary: Delegate bounded shared formatter, HUD/presenter integration, focused tests, and full self-check to implementation owner.
- Idempotency key: abi-012-formatter-start-20260829
- Request fingerprint: b3398e5b1050b791ebfde5d4e5d3a7c4bcdc2831584635dfcb68fb216d360916
- Action: set_state
- Step ID: formatter
- State: in_progress
- Evidence:
  - ABI-012 In Progress revision 6
  - Preflight readback confirmed In Progress
  - Ownership: implementation owner

### evt-6d119b60-6294-4000-a71e-4faceb1b5a2d

- Timestamp: 2026-08-28T23:43:35.256Z
- Actor: abi012-implementation
- Operation: progress.append
- Prior revision: 9
- Resulting revision: 10
- Summary: EVENT checkpoint — abi012-implementation — Shared formatter, HUD/modal/presenter integration, focused tests, and pnpm check pass; no balance or schema changes.
- Idempotency key: abi012-implementation-self-check-20260829
- Evidence:
  - pnpm vitest run: 5 files, 33 tests pass
  - pnpm check: lint, format, 64 tests, TypeScript build pass

### evt-70a1839b-440c-4b35-951e-bdbb54b5e463

- Timestamp: 2026-08-28T23:45:10.763Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 10
- Resulting revision: 11
- Summary: Shared fixed-contract formatter and focused boundary tests complete.
- Idempotency key: abi-012-formatter-complete-20260829
- Request fingerprint: a334ba2b828141bbe5cc2cff83a96eb527de74a6d976f4783ebeee2ac44d9565
- Action: set_state
- Step ID: formatter
- State: complete
- Evidence:
  - Implementation owner report
  - git diff --check clean
  - No COMBAT_BALANCE or persistence schema changes

### evt-ce40553a-b2db-466c-a2cd-9207b385c2df

- Timestamp: 2026-08-28T23:45:11.910Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 11
- Resulting revision: 12
- Summary: Start HUD, modal, and presenter integration evidence reconciliation.
- Idempotency key: abi-012-hud-start-20260829
- Request fingerprint: 3a79484f7e6141f28cd9febd24c76fb541ab31c81573aa5e28a075f9c983a3b5
- Action: set_state
- Step ID: hud-integration
- State: in_progress
- Evidence:
  - Implementation owner report
  - git diff --check clean
  - No COMBAT_BALANCE or persistence schema changes

### evt-db445edb-f701-474d-aebc-cb3635615c8c

- Timestamp: 2026-08-28T23:45:13.087Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 12
- Resulting revision: 13
- Summary: HUD, modal, and presenter numeric surfaces use shared formatter; timers, balance, and persistence remain unchanged.
- Idempotency key: abi-012-hud-complete-20260829
- Request fingerprint: fc311221a8b0166a18523dc7b34dc87da93f7656e66cd052ced06aa634f077c2
- Action: set_state
- Step ID: hud-integration
- State: complete
- Evidence:
  - Implementation owner report
  - git diff --check clean
  - No COMBAT_BALANCE or persistence schema changes

### evt-bfda3eb3-7512-4ad2-babc-fad2709cbb1b

- Timestamp: 2026-08-28T23:45:14.392Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 13
- Resulting revision: 14
- Summary: Start focused and full self-check evidence reconciliation.
- Idempotency key: abi-012-tests-start-20260829
- Request fingerprint: 8f39c9620abbd2347e229d4f1d36b7c838a83122ebf8a15935ebc1907e414339
- Action: set_state
- Step ID: number-tests
- State: in_progress
- Evidence:
  - Implementation owner report
  - git diff --check clean
  - No COMBAT_BALANCE or persistence schema changes

### evt-2cc049f0-1106-4058-b8e1-b774bb4bd5a2

- Timestamp: 2026-08-28T23:45:15.739Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 14
- Resulting revision: 15
- Summary: Focused 34 tests and full pnpm check with 65 tests, lint, format, TypeScript, and Vite build pass.
- Idempotency key: abi-012-tests-complete-20260829
- Request fingerprint: 1f9b1898a80cd4fe7e97482e3d0258500b05b6668c3f81f56cdb5b6117d4cd3a
- Action: set_state
- Step ID: number-tests
- State: complete
- Evidence:
  - Implementation owner report
  - git diff --check clean
  - No COMBAT_BALANCE or persistence schema changes

### evt-146cd846-7611-4dd4-a491-558ca65d49d3

- Timestamp: 2026-08-28T23:45:16.775Z
- Actor: abi012-implementation
- Operation: gate.record
- Prior revision: 15
- Resulting revision: 16
- Summary: Implementation owner self-check passes for shared formatter, HUD/modal/presenter integration, focused tests, and full pnpm check.
- Idempotency key: abi-012-implementation-self-check-pass-20260829
- Request fingerprint: a0574754bb0bf7141c0db8cfb6a4f89c87a277059529d4cf6abbdc079c7b624f
- Gate: implementation-self-check
- Verdict: pass
- Evidence:
  - pnpm check: pass; 65 tests
  - focused formatter/HUD/presenter: 34 tests pass
  - git diff --check: pass
  - no COMBAT_BALANCE/schema/timer change

### evt-aad8c961-cfcd-4cdc-abca-c9f564e90690

- Timestamp: 2026-08-28T23:45:17.907Z
- Actor: root-manager
- Operation: task.advance
- Prior revision: 16
- Resulting revision: 17
- Summary: Hand completed ABI-012 implementation to independent review.
- Idempotency key: abi-012-in-progress-to-review-20260829
- Request fingerprint: 343815a7d055ad59e62ec03df766feb43d035e6bd2131b54e94c77eb8ee0a119
- From status: In Progress
- To status: In Review
- Evidence:
  - implementation-self-check pass
  - Managed formatter/hud-integration/number-tests complete

### evt-8ff91ad6-40a8-4e05-a99a-48fbe5b159d0

- Timestamp: 2026-08-28T23:45:30.101Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 17
- Resulting revision: 18
- Summary: Start independent review; QA remains pending until review passes.
- Idempotency key: abi-012-number-gates-start-20260829
- Request fingerprint: d3fc5d4cb3bcb934d0602c89528bdc6ec4eab854b9c079749af93017d34f00e0
- Action: set_state
- Step ID: number-gates
- State: in_progress
- Evidence:
  - ABI-012 In Review revision 7
  - implementation-self-check pass

### evt-49653550-6f47-4a0a-91af-63d2af65552c

- Timestamp: 2026-08-28T23:49:06.495Z
- Actor: root-manager
- Operation: progress.append
- Prior revision: 18
- Resulting revision: 19
- Summary: EVENT review-pass — abi012-review — independent review approved with no P1-P3; canonical REVIEW.md recorded through the explicit narrow fallback.
- Idempotency key: abi-012-review-artifact-fallback-20260829
- Evidence:
  - Independent reviewer APPROVE; no P1-P3
  - REVIEW.md narrow fallback
  - pnpm check pass; 65 tests
  - Focused persistence-inclusive 29/29 pass
  - Vault hash d474eecce80220699b1a10534879b293303b82752f45f2dbc8f86f0f30ed8476

### evt-e1370349-9993-41e1-b08a-39d5e848a536

- Timestamp: 2026-08-28T23:49:08.144Z
- Actor: abi012-review
- Operation: gate.record
- Prior revision: 19
- Resulting revision: 20
- Summary: Independent reviewer approves ABI-012 with no P1-P3 findings.
- Idempotency key: abi-012-independent-review-pass-20260829
- Request fingerprint: 5c8d7e199e53da92cb78da268234e7f23e736b25e08b8c20ff76564e44b87236
- Gate: independent-review
- Verdict: pass
- Evidence:
  - REVIEW.md: APPROVE
  - Focused 29/29 pass
  - pnpm check pass; 65 tests
  - git diff --check pass
  - No balance/schema/timer diff

### evt-3b4e5602-96f5-47a2-b215-2608e21e0058

- Timestamp: 2026-08-28T23:49:09.232Z
- Actor: root-manager
- Operation: task.advance
- Prior revision: 20
- Resulting revision: 21
- Summary: Move approved ABI-012 to independent QA.
- Idempotency key: abi-012-review-to-qa-20260829
- Request fingerprint: 249d57afa4b35be89985d7fd22350113d955deaa16b72290026d19020f8218c6
- From status: In Review
- To status: In QA
- Evidence:
  - independent-review pass
  - REVIEW.md APPROVE
  - No repair cycle required

### evt-12385dd5-534a-41a5-be4c-aa0a4f175be2

- Timestamp: 2026-08-28T23:56:44.551Z
- Actor: root-manager
- Operation: progress.append
- Prior revision: 21
- Resulting revision: 22
- Summary: EVENT qa-pass — abi012-qa — independent local/integration browser QA passed; canonical QA.md recorded through the explicit narrow fallback; exact-SHA deployed proof remains manager-owned.
- Idempotency key: abi-012-qa-artifact-fallback-20260829
- Evidence:
  - Independent QA PASS
  - QA.md narrow fallback
  - desktop 1440x900
  - narrow 390x844
  - focused 18/18
  - pnpm check 65/65
  - valid v2 load-update-reload
  - zero console errors and overflow

### evt-acac0d6f-d22f-46ea-8caf-012fcc7c99ec

- Timestamp: 2026-08-28T23:56:46.923Z
- Actor: abi012-qa
- Operation: gate.record
- Prior revision: 22
- Resulting revision: 23
- Summary: Independent QA passes ABI-012 local/integration browser acceptance; deployed repetition remains release verification.
- Idempotency key: abi-012-independent-qa-pass-20260829
- Request fingerprint: 9f396ff712d59b9ae5373cd414cf56972983ce1e58d2f94893c980f9afbb6d0c
- Gate: independent-qa
- Verdict: pass
- Evidence:
  - QA.md PASS
  - Desktop 1440x900 production path
  - Narrow 390x844 no overflow
  - Exact ARIA/title values
  - Valid v2 load-update-reload
  - pnpm check 65/65
  - zero console errors

### evt-a48c796b-b09d-4e21-8165-db7f6fc9343b

- Timestamp: 2026-08-28T23:56:48.737Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 23
- Resulting revision: 24
- Summary: Complete independent review and local/integration QA gates with no repair cycle.
- Idempotency key: abi-012-number-gates-complete-20260829
- Request fingerprint: 6a9dcb2ce5b41164527a0e67921d690a90b17ac6a1abb45e2776ceebe1d54c12
- Action: set_state
- Step ID: number-gates
- State: complete
- Evidence:
  - independent-review pass
  - independent-qa pass
  - QA.md and REVIEW.md

### evt-bd853ace-23f7-43b2-9dc6-f22436020984

- Timestamp: 2026-08-28T23:57:08.853Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 24
- Resulting revision: 25
- Summary: Start publication and exact-SHA deployed verification while ABI-012 remains In QA; do not advance before verification passes.
- Idempotency key: abi-012-delivery-start-after-verification-block-20260829
- Request fingerprint: 066da0164d7143ea3c33241cff583419ffe01c317e09a0a919088bd3b0b70a65
- Action: set_state
- Step ID: number-delivery
- State: in_progress
- Evidence:
  - Independent review and QA pass
  - Verification gate intentionally pending exact-SHA deployment
  - ABI-012 remains In QA

### evt-cb50410b-d611-49f7-871e-fcf53911d6e6

- Timestamp: 2026-08-29T00:01:44.309Z
- Actor: root-manager
- Operation: progress.append
- Prior revision: 25
- Resulting revision: 26
- Summary: EVENT checkpoint — root-manager — exact-SHA Pages and deployed desktop/narrow repetition passed; canonical QA and VERIFICATION artifacts recorded through the explicit narrow fallback.
- Idempotency key: abi-012-deployed-verification-artifacts-20260829
- Evidence:
  - QA.md and VERIFICATION.md narrow fallback
  - published SHA 4e4c6e9a7341adaa9b596305a595acad14bfd339
  - Pages run 33222069018 success
  - deployed URL https://etherlords.github.io/autobattleidle/
  - desktop 1440x900 PASS
  - narrow 390x844 PASS
  - zero console/network/overflow

### evt-9a7876ae-96b0-4e0f-8c0a-7292480d3bc4

- Timestamp: 2026-08-29T00:01:45.916Z
- Actor: root-manager
- Operation: gate.record
- Prior revision: 26
- Resulting revision: 27
- Summary: Manager verifies all ABI-012 unit, integration, persistence, accessibility, exact-SHA Pages, and deployed acceptance evidence.
- Idempotency key: abi-012-verification-pass-20260829
- Request fingerprint: 9db296c21146b3146e490206ec319dbb371774b1792bc7b913f37890ff71e6c5
- Gate: verification
- Verdict: pass
- Evidence:
  - VERIFICATION.md acceptance mapping
  - implementation SHA 4e4c6e9a7341adaa9b596305a595acad14bfd339
  - Pages run 33222069018 success
  - deployed desktop and 390px PASS
  - Vault policy hash consistent
  - pnpm check 65/65

### evt-613868dd-e2cb-4ece-aeb3-248e8e9ec667

- Timestamp: 2026-08-29T00:01:47.011Z
- Actor: root-manager
- Operation: task.advance
- Prior revision: 27
- Resulting revision: 28
- Summary: Move fully verified ABI-012 to Ready for Manager closure.
- Idempotency key: abi-012-qa-to-ready-manager-after-verification-20260829
- Request fingerprint: 7843cc8c62813815adc562f9b51ded21a2efd3372fc77aba6792243c5fa6f331
- From status: In QA
- To status: Ready for Manager
- Evidence:
  - verification pass
  - independent-review pass
  - independent-qa pass
  - exact-SHA deployed proof pass

### evt-653f8905-f241-4565-b7a5-551cafc2a657

- Timestamp: 2026-08-29T00:02:08.925Z
- Actor: root-manager
- Operation: execution_plan.update
- Prior revision: 28
- Resulting revision: 29
- Summary: Complete ABI-012 publication, exact-SHA Pages, deployed repetition, Vault consistency, and closure evidence.
- Idempotency key: abi-012-delivery-complete-20260829
- Request fingerprint: 9050af031070fe9a74a0d47c93c83c4add6f157e9a7f460ff64dd3e74d68966a
- Action: set_state
- Step ID: number-delivery
- State: complete
- Evidence:
  - implementation SHA 4e4c6e9a7341adaa9b596305a595acad14bfd339 published
  - Pages run 33222069018 success
  - deployed desktop and 390px PASS
  - verification gate pass

### evt-09a2dae1-3b65-4123-92e4-48055dfa5741

- Timestamp: 2026-08-29T00:02:31.424Z
- Actor: manager-close-abi012
- Operation: gate.record
- Prior revision: 29
- Resulting revision: 30
- Summary: Dedicated Manager closure actor accepts ABI-012 after all gates, exact-SHA Pages, and deployed proof.
- Idempotency key: abi-012-manager-closure-pass-dedicated-actor-20260829
- Request fingerprint: 9688e53db28ee3b2d29903fd1405dd8ef4a232fb9c86d13007040b3e6d640693
- Gate: manager-closure
- Verdict: pass
- Evidence:
  - All managed steps complete
  - implementation-self-check pass
  - independent-review pass
  - independent-qa pass
  - verification pass
  - published/deployed SHA 4e4c6e9a7341adaa9b596305a595acad14bfd339

### evt-318018f8-5ccd-43d2-a8a6-7db4a460894a

- Timestamp: 2026-08-29T00:02:32.558Z
- Actor: manager-close-abi012
- Operation: task.advance
- Prior revision: 30
- Resulting revision: 31
- Summary: EVENT closed — manager-close-abi012 — ABI-012 accepted, published, deployed, and closed with no unresolved findings.
- Idempotency key: abi-012-ready-manager-to-done-dedicated-actor-20260829
- Request fingerprint: 68540760a105469f32fb31d98f07996f9b1cea9b871f66e8066563292a46fd20
- From status: Ready for Manager
- To status: Done
- Evidence:
  - All required gates pass
  - All managed steps complete
  - Exact-SHA CI/Pages and deployed proof pass

### evt-7bef8d46-4712-4a32-ab3c-aaeeb03473d8

- Timestamp: 2026-08-29T00:02:47.598Z
- Actor: manager-close-abi012
- Operation: progress.append
- Prior revision: 31
- Resulting revision: 32
- Summary: EVENT checkpoint — manager-close-abi012 — final VERIFICATION sign-off recorded through the explicit narrow fallback after canonical Done transition.
- Idempotency key: abi-012-final-verification-signoff-fallback-20260829
- Evidence:
  - VERIFICATION.md final sign-off fallback
  - ABI-012 Done revision 10
  - manager-closure pass

### evt-c85e4239-2b7a-4ede-81b0-52089b4bf8af

- Timestamp: 2026-08-29T00:03:06.066Z
- Actor: root-manager
- Operation: claim.release
- Prior revision: 32
- Resulting revision: 33
- Summary: Released task claim: Release completed ABI-012 finite manager lease
- Idempotency key: abi-012-release-claim-after-done-20260829
- Request fingerprint: 52911ebf74bc64bec651476f3ff1f08c047ad3b40c8345f0ae8dcb576c349347
- Agent ID: root-manager
- Session ID: abi-s1-manager-20260829
- Intent: Release completed ABI-012 finite manager lease
- Evidence:
  - None
