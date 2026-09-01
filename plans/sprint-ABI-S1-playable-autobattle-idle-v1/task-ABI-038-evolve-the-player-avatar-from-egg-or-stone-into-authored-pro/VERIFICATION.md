---
plannerFormat: 1
id: ABI-038
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-023
  - ABI-026
  - ABI-037
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-038 verification

## Acceptance evidence

- Published SHA: `9afb94dca90bc153ba2c0df732fbbd681d9166ea`; `origin/main` points to this exact checkpoint.
- CI run `33508871719`: PASS for the published SHA.
- Pages run `33509426805`: PASS for the same SHA. The initial push run hit a GitHub Pages API 500; a clean `workflow_dispatch` retry built and deployed one fresh artifact successfully.
- Deployed `/`: title `Etherlords Autobattle Idle`, battlefield instructions, Level 1 health, Upgrades, Leaderboard, and combat event surface visible.
- Deployed `/visual-lab.html`: independent lab title, player subject, all six stages, all five views, recipes, cues, resource receipt, and the selected Astral Sovereign stage visible.
- Fresh isolated deployed browser: console 0 errors/warnings; localStorage empty; sessionStorage empty; network static-only.
- Canonical checks: 23/23 test files and 213/213 tests PASS, worker typecheck PASS, production build PASS, explicit multi-entry visual-lab build PASS.
- Persistence classification remains no schema change. The lab neither imports nor writes persistence/gameplay/leaderboard state; production `PlayerUnit` was not changed before user visual approval.
- Vault readback: `Testing Strategy#Layers` hash `fb6ae12b2336fa70b81321bd996a63cb789a39dfdd04071a646d4f204996f2fc`; `Release and Deployment Operations#Release checklist` hash `8caee632eb6e4f23fab26a842136d833d952eaed974cd93852987e717252b53b`.

## Sign-off

- Reviewer: PASS — independent review v5.
- QA: PASS — independent browser QA v3, corrected against the frozen Golden Beetle contract.
- Manager close: PASS — exact-SHA CI, Pages, deployed route/isolation proof, and Vault readback complete.
