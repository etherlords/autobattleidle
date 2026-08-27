---
plannerFormat: 1
id: ABI-002
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-001
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-002 verification

## Acceptance evidence

- Manual and unlocked scheduled automatic attacks call the same pure `attack` command; locked or early automatic commands are ignored.
- Damage is deterministic; armor cannot reduce a valid hit below one and a critical deals exactly 2x final damage.
- Lethal attacks atomically grant the reward, advance the encounter, and spawn the next enemy; stale enemy IDs cannot grant the reward again.
- Reward doubling, encounter grades, boss cadence, seeded elite modifiers, automatic slow, and unaffected manual attacks have focused deterministic tests.
- `src/domain/combat.ts` imports no DOM or Three.js code; no ABI-003+ production path changed.
- Implementation owner: focused 7/7 and full `pnpm check` passed after one review repair.
- Independent review: PASS after the automatic-unlock P1 repair; no P1-P3 remain.
- Independent QA: focused 7/7 in 0.973s and full `pnpm check` in 4.909s; no defects or QA repair.
- Manager fresh check: `pnpm check` passed with 2 files/8 tests and production build in 4.989s; `git diff --check` passed.
- Vault GPU proof: configured `embeddingDevice=vulkan`, adapter 0; first ABI-002 hybrid call produced RTX 5060 Ti `gpuOffloading=true`, 25 GPU layers at `2026-08-27T23:36:33.885Z`. CPU/auto fallback was not used.
- Functional checkpoint `610f208b8513e1f350ed4b01245e23abe60e4a37` was pushed to `origin/main`.
- CI run `33127933135` and check job `98710418379` completed successfully.
- Pages run `33127933128` and deploy job `98710418985` completed successfully in 30 seconds.
- `https://etherlords.github.io/autobattleidle/` returned HTTP 200, `text/html`, title `Etherlords Autobattle Idle`, and an entry script; request time was 485ms.
- Elapsed through published closure was about 21 minutes: implementation 4 min plus 2 min repair; manager preflight/overhead about 5 min; Planner/Vault active call time about 1 min; review about 7 min; QA about 2 min including reporting; CI/Pages/public wait about 1 min. No exact token-savings claim is made.

## Sign-off

- Reviewer: PASS after one bounded repair
- QA: PASS, no repair
- Verification: PASS
- Manager close: PASS; ABI-002 reached Done at task revision 8 / board revision 28 and released its lease at progress revision 35
