---
plannerFormat: 1
id: ABI-041
artifact: verification
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

# ABI-041 verification

## Acceptance evidence

- Seven committed immutable fixtures cover V1, V2, unversioned legacy V2, pre-player-relative V3,
  two active-Golden V3 shapes, and current V4 with non-zero Golden defeats.
- The closed matrix is linked to `SAVE_VERSION`, compares complete canonical enemy/player state,
  preserves exact source values, publishes only V4, and reloads without semantic loss.
- A focused four-slot regression proves strict `V3 -> V2 -> legacy -> V1` precedence, invalid/remove
  fall-through, exact raw/invalid/absent historical values, and `[SAVE_V4_KEY]` as the sole write.
- Valid-V4 startup, explicit Restore, malformed-newer fallback, failed-write retry, and stale-pending
  cancellation remain explicit default-suite regressions.
- Persistence impact: no schema change; production runtime, formulas, keys, codecs, UI, and Worker
  were unchanged.
- Review v6: APPROVE. Independent QA: PASS.
- Published implementation SHA `9a94b7e3ffb9c1101cf5673062589e6871adc153`: CI `33460104159`
  success; Pages `33460104195` success; deployed asset hash
  `D1B667064807F107A50DF363BB898DD2347AB4EB3327A1386B801C49BDD2A252`.
- Vault authority: `AUTOBATTLEIDLE-DOC-20260827-E27CD3`, `Persistence Contract`, lines 38-45,
  content hash `de611159417695f3400a413a2ef51cab77c24a55478ff212095fa4ab6bea4191`.

## Sign-off

- Reviewer: pass
- QA: pass
- Manager close: pending exact-SHA closure checkpoint
