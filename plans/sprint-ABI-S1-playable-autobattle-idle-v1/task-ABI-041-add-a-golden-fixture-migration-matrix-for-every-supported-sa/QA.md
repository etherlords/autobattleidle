---
plannerFormat: 1
id: ABI-041
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-041 qa

## Verdict

PASS — independent local and exact-SHA deployed QA.

## Evidence

- Local: `pnpm vitest run src/persistence/persistence-boundary.test.ts` passed 22/22; full
  `pnpm check` passed lint, format, 20 files / 185 tests, Worker typecheck, and production build.
- Published source: `9a94b7e3ffb9c1101cf5673062589e6871adc153`; CI run `33460104159` and
  Pages run `33460104195` succeeded.
- The served JavaScript matched the downloaded Pages artifact byte-for-byte, SHA-256
  `D1B667064807F107A50DF363BB898DD2347AB4EB3327A1386B801C49BDD2A252`.
- Isolated Playwright contexts loaded V1, V2, legacy V2, encounter-2170 V3, active-Golden V3,
  high-APS active-Golden V3, and current V4 with three Golden defeats. Historical bytes remained
  exact, historical loads published V4, and reload preserved the selected canonical state.
- The four-slot fixture chose V3 first and the focused integration suite proved
  `V3 -> V2 -> legacy -> V1`, malformed fallback, explicit Restore, failed-write retry, and stale
  pending cancellation.
- Desktop `1440x900` and narrow `390x844` passed. Console had zero errors/warnings; network contained
  only expected static requests.
- QA used separate Playwright sessions and never attached to or modified the user's Chrome storage.
