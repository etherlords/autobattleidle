---
plannerFormat: 1
id: ABI-004
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-004 verification

## Acceptance evidence

- Live composition: application owns one `CombatState`, frame scheduler, immutable snapshots, and clean
  disposal; focused application/domain tests PASS.
- Enemy HUD: name, level, grade, modifier, shrinking accessible current/max HP bar verified by code review
  and real Chromium QA.
- Manual input: pointer, Enter, and Space each caused exactly one immediate attack in Chromium; the active
  automatic countdown continued rather than resetting.
- Automatic input: locked state, unlock, visible seconds/milliseconds countdown, one attack at zero, and
  interval reset observed in Chromium; exact scheduler behavior has deterministic domain coverage.
- Grade +2 slow and speed reschedule: deterministic focused test proves the new slow-modified deadline is
  computed from purchase time and a following manual attack leaves it unchanged.
- Rewards/log: kill transitions, coin increases, purchase/kill feedback, and bounded six-entry log observed.
- Economy: all five upgrade paths, costs, prerequisites, caps, and disabled reasons covered by deterministic
  tests and browser QA.
- Responsive/accessibility: desktop and `390x844` browser QA PASS with a clean console.
- Disposal: focused HUD/application tests prove all listeners are removed and disposal is idempotent.
- Independent review: PASS after listener, speed-reschedule, and evidence-boundary repairs.
- Independent QA: PASS on `http://127.0.0.1:5173/` with actual state transitions.
- Manager `pnpm check`: PASS, 3 files / 11 tests, TypeScript and Vite build; existing >500 KB chunk advisory only.
- Manager `git diff --check`: PASS.
- Published commit: `849524e534f22ed4d7d4ce9e262859f86a0f92da` pushed to `origin/main`.
- CI: PASS, run `33132218859`, check job completed in 22 seconds.
- GitHub Pages: PASS, run `33132218783`, deploy job completed in 26 seconds.
- Public URL: `https://etherlords.github.io/autobattleidle/`.
- Deployed assets returned HTTP 200 and matched the commit build: `index-9ijaY3gu.js` and
  `index-BpE-2Ij5.css`.
- Deployed real-Chromium proof: initial `10/10` HP; pointer `10 -> 9`, Enter `9 -> 8`, and Space
  `8 -> 7`, each with exactly one event; first kill spawned the next enemy, granted one coin, and logged
  `Manual kill: +1 coins`.
- Deployed automatic proof: unlock exposed a live countdown; automatic hits reduced HP and reset the
  interval. During an active elite countdown, a pointer hit changed HP `27 -> 26` while remaining time
  continued `1.375s -> 1.361s` rather than resetting. A bounded interval changed HP `8 -> 7` and reset
  the countdown; the event list stayed capped at six.
- Deployed responsive proof: `390x844` viewport had no overflow and retained usable/readable HUD,
  countdown, controls, and log. Console had zero errors and zero warnings.

## Sign-off

- Reviewer: PASS — `autobattle-reviewer-abi004`
- QA: PASS — `autobattle-qa-abi004-final`
- Manager close: PASS after commit/push, CI, Pages, and deployed functional proof
