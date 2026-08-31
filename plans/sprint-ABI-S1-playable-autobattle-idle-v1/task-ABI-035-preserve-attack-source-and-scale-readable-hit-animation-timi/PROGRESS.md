---
plannerFormat: 1
id: ABI-035
artifact: progress
project: ABI
profile: high-assurance
revision: 21
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

# ABI-035 progress

## Current state

- Status: Blocked
- Revision: 21
- Last update: Add detailed ABI-035 execution step: attack-manager-closure.

## Execution plan

- [-] attack-timing-preflight: Trace every attack caller and freeze source, APS, packet, cue, and lethal sequencing contracts
- [-] attack-cue-contract: Extend the smallest shared immutable presentation cue with attack source and bounded timing metadata
- [-] attack-effect-timing: Drive authored hit phases from manual or effective-APS timing while preserving bounded high-APS visuals
- [-] attack-timing-tests: Add focused contract, lifecycle, reduced-motion, replacement, and browser timing regressions
- [-] attack-timing-gates: Complete independent review, QA, Vault sync, pnpm check, exact-SHA deploy proof, and Manager closure
- [ ] attack-contract-refresh: Manager waits for ABI-020 closure and freezes its final packet receipt, visible cadence, effective APS semantics, lethal order, reduced-motion policy, and no-schema boundary
- [ ] attack-producer-audit: Enumerate every manual, automatic, batched, critical, armor, lethal, replacement, reset, boss, and Golden visual-cue producer
- [ ] attack-consumer-audit: Enumerate presenter, snapshot, battlefield, unit animation, effect phase, camera, test, and future audio consumers; identify the exact lossy seam
- [ ] attack-cue-schema: Define the minimum discriminated immutable cue carrying semantic kind, attack source, packet receipt, and bounded timing input without duplicating combat state
- [ ] attack-source-propagation: Carry the cue through controller, presenter, snapshot, and battlefield with exhaustive compile-time handling and unchanged event/reward order
- [ ] attack-timing-policy: Derive named manual and automatic wind-up, impact, hold, and retire bounds from accepted visible cadence; clamp low, mid, and 10-plus APS cases
- [ ] attack-effect-integration: Drive existing animation/effect owners from the timing policy without adding RAF loops, domain timers, saved presentation state, or unbounded overlap
- [ ] attack-lethal-lifecycle: Preserve hit-pause-death sequencing, critical/armor identity, replacement, reset, reduced motion, camera behavior, and exact one-time disposal
- [ ] attack-contract-regressions: Add source, packet, cue exhaustiveness, finite timing, low-mid-high APS, critical, armor, lethal, reset, replacement, and disposal tests
- [ ] attack-browser-fixtures: Add deterministic manual, low-APS, mid-APS, and 10-plus-APS browser cases with frame/state-action-time-visible-result receipts
- [ ] attack-self-check: Implementation owner runs focused tests, unchanged combat/save byte checks, resource checks, and pnpm check
- [ ] attack-independent-review: Independent Reviewer audits all producers/consumers, ABI-020 packet reuse, timing math, sequencing, disposal, and regression completeness
- [ ] attack-independent-qa: Independent QA verifies source distinction, readable timing, bounded high-APS visuals, lethal order, reduced motion, desktop/narrow, and clean resources
- [ ] attack-manager-closure: Manager updates Vault, records verification, publishes the coherent checkpoint, and proves exact-SHA CI and deployed Pages behavior

## Events

### evt-9df255bc-70c1-4d56-9a4f-08036647cc12

- Timestamp: 2026-08-31T19:41:23.020Z
- Actor: root-task-recovery-audit
- Operation: progress.append
- Prior revision: 1
- Resulting revision: 2
- Summary: EVENT checkpoint — root-task-recovery-audit — User-requested missing task was created; manager-owned ANALYSIS and IMPLEMENTATION-GUIDE were populated through the documented narrow Markdown fallback because Planner exposes no section-write operation. Research, architecture, persistence impact, risks, execution order, and verification layers are frozen for future JIT refresh before claim.
- Idempotency key: abi035-research-packet-20260901-v1
- Evidence:
  - ANALYSIS.md: AttackSource retained in controller/presenter but lost in BattleSnapshot.visualCues
  - IMPLEMENTATION-GUIDE.md: minimal discriminated cue and APS-bounded existing effect lifecycle
  - ABI-020 10-plus effective APS and approximately 3 Hz visible cadence dependency
  - Vault Technical Architecture D74E4E and Combat Loop 584401

### evt-cf70237f-d65a-4b21-a22a-ff3de7fce924

- Timestamp: 2026-08-31T19:49:46.805Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 2
- Resulting revision: 3
- Summary: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Idempotency key: abi-035-cancel-attack-timing-preflight-20260901
- Request fingerprint: 31528ce9fc5389ba475be9593f41787ba76173b26fc8f59112e6dc72df058959
- Action: set_state
- Step ID: attack-timing-preflight
- State: cancelled
- Reason: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Evidence:
  - User requested task-specific decomposition instead of generic implementation and gate steps.

### evt-dd266e01-7351-48ac-b8ab-0db560f77f07

- Timestamp: 2026-08-31T19:49:53.639Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 3
- Resulting revision: 4
- Summary: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Idempotency key: abi-035-cancel-attack-cue-contract-20260901
- Request fingerprint: 61ef4bb256e5a5587f9ad21f4121ac9458f78b924d246b2f2195a092ee69a893
- Action: set_state
- Step ID: attack-cue-contract
- State: cancelled
- Reason: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Evidence:
  - User requested task-specific decomposition instead of generic implementation and gate steps.

### evt-f4edc370-25d1-4115-ab3e-48268bfbda87

- Timestamp: 2026-08-31T19:50:00.894Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 4
- Resulting revision: 5
- Summary: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Idempotency key: abi-035-cancel-attack-effect-timing-20260901
- Request fingerprint: 5973d99364159a74c5630eb3232cbf54c3370c92a02dbe3360fd313cd463f38c
- Action: set_state
- Step ID: attack-effect-timing
- State: cancelled
- Reason: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Evidence:
  - User requested task-specific decomposition instead of generic implementation and gate steps.

### evt-fc9774f3-c123-48ff-9de1-cbbbcb08ef36

- Timestamp: 2026-08-31T19:50:07.520Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 5
- Resulting revision: 6
- Summary: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Idempotency key: abi-035-cancel-attack-timing-tests-20260901
- Request fingerprint: e65092d556662b16315c46586ce0d9785012f3ec7623854d6468fc9b0213803e
- Action: set_state
- Step ID: attack-timing-tests
- State: cancelled
- Reason: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Evidence:
  - User requested task-specific decomposition instead of generic implementation and gate steps.

### evt-01397994-10ff-4ec2-bff8-8673c246ee2f

- Timestamp: 2026-08-31T19:50:15.256Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 6
- Resulting revision: 7
- Summary: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Idempotency key: abi-035-cancel-attack-timing-gates-20260901
- Request fingerprint: d00243493c26ed8a5e781096abb69747e126f9e1a6e21825b241210aaff964ca
- Action: set_state
- Step ID: attack-timing-gates
- State: cancelled
- Reason: Superseded coarse ABI-035 step with complexity-calibrated execution plan.
- Evidence:
  - User requested task-specific decomposition instead of generic implementation and gate steps.

### evt-454e63bc-b8b9-40ee-ab9b-460a4f9cb8f7

- Timestamp: 2026-08-31T19:50:18.459Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 7
- Resulting revision: 8
- Summary: Add detailed ABI-035 execution step: attack-contract-refresh.
- Idempotency key: abi-035-add-attack-contract-refresh-20260901
- Request fingerprint: 1218799dad56b4780b07dd57ec6faa438481ab3cebf9c65789165ce5aa169c13
- Action: add
- Step ID: attack-contract-refresh
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-7665ccde-563f-46a5-8e7b-4c0979a9eacf

- Timestamp: 2026-08-31T19:50:24.021Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 8
- Resulting revision: 9
- Summary: Add detailed ABI-035 execution step: attack-producer-audit.
- Idempotency key: abi-035-add-attack-producer-audit-20260901
- Request fingerprint: 7fde570117d91fcf7fdcd775512ef57dc77c653ef7dd77a2613291152e5b67cb
- Action: add
- Step ID: attack-producer-audit
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-906de943-30ed-4562-a224-a9494481add7

- Timestamp: 2026-08-31T19:50:31.103Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 9
- Resulting revision: 10
- Summary: Add detailed ABI-035 execution step: attack-consumer-audit.
- Idempotency key: abi-035-add-attack-consumer-audit-20260901
- Request fingerprint: b359c5d17195d6b33ad237b48ca95df1beee9f00680f39e3af2ec77eca444dba
- Action: add
- Step ID: attack-consumer-audit
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-800e6724-d0a1-463b-9ec5-71e384608932

- Timestamp: 2026-08-31T19:50:37.884Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 10
- Resulting revision: 11
- Summary: Add detailed ABI-035 execution step: attack-cue-schema.
- Idempotency key: abi-035-add-attack-cue-schema-20260901
- Request fingerprint: dc34c1ac5375db5a8984a25c44a1a7bcae13abea2118eb49989994c017f4a796
- Action: add
- Step ID: attack-cue-schema
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-f97b5e65-6645-4c7c-82f1-af923c6218d2

- Timestamp: 2026-08-31T19:50:44.466Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 11
- Resulting revision: 12
- Summary: Add detailed ABI-035 execution step: attack-source-propagation.
- Idempotency key: abi-035-add-attack-source-propagation-20260901
- Request fingerprint: 2d5c14ebe8bbeaff967a2b59e778da1227b8c3856c9663f133aad1709344f738
- Action: add
- Step ID: attack-source-propagation
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-212f5d4d-8690-4284-b5ee-53ad656ba2df

- Timestamp: 2026-08-31T19:50:52.383Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 12
- Resulting revision: 13
- Summary: Add detailed ABI-035 execution step: attack-timing-policy.
- Idempotency key: abi-035-add-attack-timing-policy-20260901
- Request fingerprint: eae977b72e90c7c4591582011203c613e23fcfe3fd76e8dcb01388b0b230dd01
- Action: add
- Step ID: attack-timing-policy
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-0efaa719-6c94-4cac-a1cc-68f9b1957bdf

- Timestamp: 2026-08-31T19:50:55.661Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 13
- Resulting revision: 14
- Summary: Add detailed ABI-035 execution step: attack-effect-integration.
- Idempotency key: abi-035-add-attack-effect-integration-20260901
- Request fingerprint: 8f884235c79fa3f3cef26eadc6e9963f8662b0ef19cb5733c0f53446d9614966
- Action: add
- Step ID: attack-effect-integration
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-dccf1365-a714-43c7-bb8e-aa968832860b

- Timestamp: 2026-08-31T19:51:01.933Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 14
- Resulting revision: 15
- Summary: Add detailed ABI-035 execution step: attack-lethal-lifecycle.
- Idempotency key: abi-035-add-attack-lethal-lifecycle-20260901
- Request fingerprint: 65ec9bf29e2b6b5e5c327357186db7f6eb1ffaf4ca3d311db713923c88679863
- Action: add
- Step ID: attack-lethal-lifecycle
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-bb4ad9d1-d06f-455b-b524-97edc54852e6

- Timestamp: 2026-08-31T19:51:08.566Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 15
- Resulting revision: 16
- Summary: Add detailed ABI-035 execution step: attack-contract-regressions.
- Idempotency key: abi-035-add-attack-contract-regressions-20260901
- Request fingerprint: 53516f138b51bd86a0490b5de354ccf4877398f07542ac508d08c2d22fe0ef59
- Action: add
- Step ID: attack-contract-regressions
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-331538a6-6078-43fc-9d75-34ff06a92b9d

- Timestamp: 2026-08-31T19:51:15.710Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 16
- Resulting revision: 17
- Summary: Add detailed ABI-035 execution step: attack-browser-fixtures.
- Idempotency key: abi-035-add-attack-browser-fixtures-20260901
- Request fingerprint: b8e133fa938766277517022f4712b8f1f980be5e919c7b92faf43c5b7f2e58ea
- Action: add
- Step ID: attack-browser-fixtures
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-fe8f444d-5414-4af5-b418-30976cd848c3

- Timestamp: 2026-08-31T19:51:23.052Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 17
- Resulting revision: 18
- Summary: Add detailed ABI-035 execution step: attack-self-check.
- Idempotency key: abi-035-add-attack-self-check-20260901
- Request fingerprint: c3367059c6ca472cee2b393139e9756960b8907ca59f8958295af798532dea62
- Action: add
- Step ID: attack-self-check
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-1a61c119-c6e1-4866-8b5a-6f10e2faf8bb

- Timestamp: 2026-08-31T19:51:24.932Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 18
- Resulting revision: 19
- Summary: Add detailed ABI-035 execution step: attack-independent-review.
- Idempotency key: abi-035-add-attack-independent-review-20260901
- Request fingerprint: 10f93a7fe27b5199ca2320e8944a8e837fb99ff4ec0a75b9d15444fb11cd4367
- Action: add
- Step ID: attack-independent-review
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-9bcf1f51-8770-47f9-b9f7-c67d5ef9dcd8

- Timestamp: 2026-08-31T19:51:27.139Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 19
- Resulting revision: 20
- Summary: Add detailed ABI-035 execution step: attack-independent-qa.
- Idempotency key: abi-035-add-attack-independent-qa-20260901
- Request fingerprint: e29bd7f9718424c11c0a7723fd38ab20f48c11ac91991ef7ab8c50bb5bc476ee
- Action: add
- Step ID: attack-independent-qa
- Evidence:
  - Complexity and overlap audit across active ABI tasks.

### evt-2cbd63b0-e0b9-43d3-8783-20e2b1161cd1

- Timestamp: 2026-08-31T19:51:31.557Z
- Actor: root-recovery-planner
- Operation: execution_plan.update
- Prior revision: 20
- Resulting revision: 21
- Summary: Add detailed ABI-035 execution step: attack-manager-closure.
- Idempotency key: abi-035-add-attack-manager-closure-20260901
- Request fingerprint: f785d9dcdb5913020126190209066055822af4df6cdadfead0c6c1f320407cde
- Action: add
- Step ID: attack-manager-closure
- Evidence:
  - Complexity and overlap audit across active ABI tasks.
