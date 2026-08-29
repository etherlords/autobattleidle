---
plannerFormat: 1
id: ABI-010
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-009
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-010 verification

## Acceptance evidence

- Deterministic event rule: direct tests spawn after progression encounter 50 only, preserve the resume encounter, and cover ordinary/boss continuation.
- Ten-second window: controller tests anchor one 10,000 ms deadline across manual/automatic hits and make timeout win at equality; independent browser reload reads 9.9 s after a 100 ms post-reload wait and auto-only escape passes at 10.2 s.
- Balance: health is five times the base automatic window envelope; auto-only fails while the measured 10 Hz/manual scenario succeeds. Fixed reward is ten times the resumed enemy reward, safely saturated and awarded exactly once; browser observed exactly +1,220 once.
- Presentation: snapshot/HUD countdown, compact metallic body, crown/orbital non-color cue, passive input ownership, desktop/narrow layouts, and deterministic disposal are covered by tests and browser receipts.
- Persistence impact: schema migration to V3. Active event identity/resume encounter are stored without a deadline; V1 -> V2 -> V3 and direct byte-preserving V2 -> V3 publication/reload pass; malformed V3 recovers valid V2.
- Quality: implementation self-check PASS; fresh independent re-review APPROVE after one bounded repair; independent QA PASS; `pnpm check` 88/88 and `git diff --check` PASS.
- Publication: `HEAD` and `origin/main` were `143adc743399a367361ea91a831809cfcb61c39a`; CI run [33251891054](https://github.com/etherlords/autobattleidle/actions/runs/33251891054) and Pages run [33251891086](https://github.com/etherlords/autobattleidle/actions/runs/33251891086) both completed successfully for that exact SHA. GitHub deployment `6155549282` names the same SHA.
- Deployed proof: `https://etherlords.github.io/autobattleidle/` served the release assets. A seeded active V3 fixture reloaded to `Golden Bug escaping in 9.9s` after 100 ms; after 10.2 s it resumed Elite Ash Wisp Level 51, retained `Coins: 100`, logged `Golden Bug escaped.`, and persisted `goldenBug: null`. Console errors/warnings and failed requests were all zero. Receipt: `.playwright-cli/abi-010/golden-deployed-timeout.png`.

## Sign-off

- Reviewer: APPROVE — no P0-P3 after fixed-deadline and V2-retention repairs.
- QA: PASS — local desktop/narrow functional and persistence evidence.
- Manager close: publication and deployed functional proof PASS; ready for canonical closure and final audit.
