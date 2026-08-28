---
plannerFormat: 1
id: ABI-018
artifact: progress
project: ABI
profile: high-assurance
revision: 13
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

# ABI-018 progress

## Current state

- Status: Blocked
- Revision: 13
- Last update: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.

## Execution plan

- [-] balance-preflight: Manager freezes APS constants, displayed precision, persistence impact, and ABI-014/016 timing consequences after ABI-017
- [-] derived-stats-contract: Implementation owner exposes named derived player stats in the snapshot and renders the compact accessible modal panel
- [-] automatic-speed-curve: Implementation owner applies the calibrated bounded APS curve and preserves cooldown and automatic-slow semantics
- [-] self-check: Implementation owner adds formula table, monotonicity, HUD, save, and progression regressions and runs pnpm check
- [-] independent-gates: Independent Reviewer and browser QA verify balance, accessibility, desktop/narrow layout, and long-run automation
- [-] manager-closure: Manager updates accepted Vault formulas, closes Planner, publishes, and proves exact-SHA CI/Pages
- [ ] stats-aps-preflight-v2: Manager freezes APS constants, displayed precision, no-schema persistence impact, ABI-014 starter implications, and existing progression timing after ABI-017; ABI-016 remains camera-only
- [ ] derived-stats-contract-v2: Implementation owner exposes named derived player stats in the snapshot and renders the compact aria-readable modal panel
- [ ] automatic-speed-curve-v2: Implementation owner applies the calibrated bounded APS curve and preserves cooldown and automatic-slow semantics
- [ ] stats-aps-self-check-v2: Implementation owner adds formula table, monotonicity, HUD, save, starter progression, and long-run automation regressions then runs pnpm check
- [ ] stats-aps-independent-gates-v2: Independent Reviewer and desktop/390px browser QA verify formulas, accessibility, layout, persistence, and long-run automation
- [ ] stats-aps-manager-closure-v2: Manager records verification, updates accepted Vault formulas, publishes coherently, and proves exact-SHA CI/Pages

## Events

### evt-e1ce790b-5157-497e-acfa-533b2e9016c4

- Timestamp: 2026-08-28T21:24:05.940Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 1
- Resulting revision: 2
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-balance-preflight-20260829-01
- Request fingerprint: c4fec0f3093a2331814460203fc8da3ee13d45de4aff91d538d007a451b65bb1
- Action: set_state
- Step ID: balance-preflight
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-0b6d75d1-7016-414e-9190-2a9a599ac73c

- Timestamp: 2026-08-28T21:24:07.006Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 2
- Resulting revision: 3
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-derived-stats-contract-20260829-01
- Request fingerprint: e2f958495842a511e172d22950fe42edc02624ff20fc672e8addf49fd6e63942
- Action: set_state
- Step ID: derived-stats-contract
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-3e872b6f-cffe-4309-b5fd-246ec9c561e2

- Timestamp: 2026-08-28T21:24:08.167Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 3
- Resulting revision: 4
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-automatic-speed-curve-20260829-01
- Request fingerprint: 75b2fb374ccd2fd511a8e9df4ee0899af49ba54476ee8b46df3cfdf74b2b8091
- Action: set_state
- Step ID: automatic-speed-curve
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-56a8bf26-bf2e-4fa3-a39a-874de4561e1b

- Timestamp: 2026-08-28T21:24:09.267Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 4
- Resulting revision: 5
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-self-check-20260829-01
- Request fingerprint: bee95a177fe38a373d4dc18ae52461d3e0b1c426bbc6c40125005cf771942f23
- Action: set_state
- Step ID: self-check
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-15463557-e439-445e-86a4-54661c8f1af7

- Timestamp: 2026-08-28T21:24:10.325Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 5
- Resulting revision: 6
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-independent-gates-20260829-01
- Request fingerprint: 7c135391e0e3559ef705f282bf238370dc9ed377efa9bce131454fb9d548d714
- Action: set_state
- Step ID: independent-gates
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-1f4f47f1-3acc-4779-9341-774f1f6f1473

- Timestamp: 2026-08-28T21:24:11.432Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 6
- Resulting revision: 7
- Summary: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Idempotency key: abi018-cancel-manager-closure-20260829-01
- Request fingerprint: 6ed3dbcb2d71c8a0b493a98fef5c8f66d26513fc5e5439c3b7b35415f20fe0af
- Action: set_state
- Step ID: manager-closure
- State: cancelled
- Reason: Cancel stale ABI-018 execution route so cadence assumptions are removed and corrected history is appended.
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-fe5cdc8f-e9e9-460e-a40b-ffd628b9278b

- Timestamp: 2026-08-28T21:24:12.501Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 7
- Resulting revision: 8
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-stats-aps-preflight-v2-20260829-01
- Request fingerprint: dc2cfccf4534a80123eecf30bd88dfca9f2d1cae0197e83e22bd717dff44df86
- Action: add
- Step ID: stats-aps-preflight-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-82755daf-3a2e-45c9-a51f-997962f3975d

- Timestamp: 2026-08-28T21:24:13.624Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 8
- Resulting revision: 9
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-derived-stats-contract-v2-20260829-01
- Request fingerprint: 53635e57aa59c62412af5841639a7ef6ff0dbb7ab07e00089bccedb0d8c70b88
- Action: add
- Step ID: derived-stats-contract-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-fcb8ed61-a06d-4a85-b0e4-ad49acbbf1cb

- Timestamp: 2026-08-28T21:24:14.692Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 9
- Resulting revision: 10
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-automatic-speed-curve-v2-20260829-01
- Request fingerprint: c65b36f6efae7d897fc57b670494aeb128fb50b198e8dd6cd7ebedfb755e510f
- Action: add
- Step ID: automatic-speed-curve-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-d78cb5df-14b7-44bb-ae39-e826964e87f4

- Timestamp: 2026-08-28T21:24:15.788Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 10
- Resulting revision: 11
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-stats-aps-self-check-v2-20260829-01
- Request fingerprint: 13de48022a59c77b0fd21916b84fdb9dc86008a25d6467dcaba11a135b116561
- Action: add
- Step ID: stats-aps-self-check-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-c888120c-881b-462c-abbf-06ee6829aa80

- Timestamp: 2026-08-28T21:24:16.869Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 11
- Resulting revision: 12
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-stats-aps-independent-gates-v2-20260829-01
- Request fingerprint: 83fcccd8b6e86c1655f867007b8dca268468e3ba39bdbe550353f9d1e88a734c
- Action: add
- Step ID: stats-aps-independent-gates-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md

### evt-80d645d0-740f-4eb2-ae98-4dcd2074b3b9

- Timestamp: 2026-08-28T21:24:17.979Z
- Actor: manager-root
- Operation: execution_plan.update
- Prior revision: 12
- Resulting revision: 13
- Summary: Append corrected ABI-018 stats/APS execution step without stale ABI-016 cadence coupling.
- Idempotency key: abi018-add-stats-aps-manager-closure-v2-20260829-01
- Request fingerprint: eff7d10275b26599ab08faea23c14c8990da15237c52c4a758c7c93f669305ab
- Action: add
- Step ID: stats-aps-manager-closure-v2
- Evidence:
  - plans/sprint-ABI-S1-playable-autobattle-idle-v1/task-ABI-018-show-current-upgrade-stats-and-rebalance-automatic-attack-sp/BRIEF.md
