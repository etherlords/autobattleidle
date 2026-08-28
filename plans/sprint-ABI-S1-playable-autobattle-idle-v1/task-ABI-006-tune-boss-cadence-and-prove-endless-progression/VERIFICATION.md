---
plannerFormat: 1
id: ABI-006
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-006 verification

## Acceptance evidence

- Deterministic simulator: exact report is asserted and independently reproduced. Boss encounters 15/30/45 occur at 596,085.714285711 / 1,296,381.36645964 / 2,135,163.9751553102 ms with increasing 9.93 / 11.67 / 13.98 minute intervals. Report: automatic 2,262, manual 0, coins 18,081, encounter 46, armor-prevented damage 50,313, penetration 0.25, and exact purchases unlock 1 / damage 31 / penetration 10 / speed 3 / critical 0 / double reward 0.
- Reference strategy: simulator purchases only after a defeated enemy and at most one repeatable upgrade; 44 repeatable purchases for 45 defeats. Runtime and simulator share combat, spawn, reward, cost, chance, interval, penetration and transition helpers.
- Endless numeric safety: practical and 999,999→1,000,000 adjacent effects improve for all five repeatable upgrades. Effect-aware representation-boundary checks prevent no-op/regressing purchases and preserve currency. Costs, rewards, coins, damage, health and highest-boss saves remain finite safe integers; encounter endpoint rolls to a new epoch without stalling.
- Armor penetration: one bounded shared formula preserves minimum hit damage. Browser QA observed comparable armored hits improve from 36 to 37 after a penetration purchase, and persistence restored the purchase after reload.
- Runtime/browser: Chromium local preview proved unlock, automatic hits, damage purchase, reload persistence, penetration, multi-boss progression through encounter 90, desktop `1280x800`, narrow `390x844`, zero console errors/warnings, and no visible NaN/Infinity/negative/overflow values.
- Persistence: V2 exact-key validation, level/derived-field cross-checks, valid integer hit round-trip, malformed/inconsistent fallback, safe highest-boss round-trip and reload behavior are covered by tests/QA.
- Vault: A7FD1F hash `5359568eb03fcc9378944eec6dd64bb119a115ae0f4db6c47b4957bd7f09d8ec`, A798F2 hash `c2d64897e4d5e82828a3f516e47331b76989389ca3bc095a3e7f300044e8239b`, and 584401 hash `1d0ea54c8b8f3bdb1f76df159315c6f60c2a56234ff034b0876c89f31a938c83`; native status is fresh with zero dirty, failed or pending paths.
- Gates/checks: independent Reviewer run 8 APPROVE with no P0–P2; independent QA PASS. Fresh Manager `pnpm check` passed lint, format, 14 tests, TypeScript and Vite build; `git diff --check` passed; Planner doctor healthy with only the expected dirty-checkpoint warning.
- Evidence caveat: QA screenshot creation failed because the CLI selector syntax was invalid, so no screenshot artifact exists. Behavioral observations and executable checks remain reproducible and passed.
- Scope: ABI-006 code, packet and related Vault articles only. ABI-007+ implementation is absent and `.playwright-cli/` is excluded.

## Sign-off

- Reviewer: APPROVE — independent run 8, no P0–P2.
- QA: PASS — independent simulator and real-browser acceptance.
- Manager verification: PASS — local checks, packet/Vault health, evidence mapping and scope audit complete.
- Manager close: pending coherent commit/push, CI/Pages and deployed proof.
