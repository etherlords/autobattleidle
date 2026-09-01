---
plannerFormat: 1
id: ABI-028
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-028 verification

## Acceptance evidence

- ABI-020 decision consumed without a production retune: normal/veteran/elite remain `1/5/10`
  logical attacks, bosses remain 30 hits, and Golden Bug, reward, upgrade, HP, and persistence owners
  are unchanged.
- The deterministic simulator reports automatic-only, manual-only, and combined ordinary TTK for
  early `1–99`, start+ `100–499`, late start `500–999`, midgame `1,000–9,999`, endgame start
  `10,000–24,919`, and endgame `24,920+`; the first actual ordinary endgame snapshot is encounter
  `24,921` after the real boss reward and purchase transition.
- Raw packets and logical attack units are separate; fractional high-APS packets, mid-batch spill,
  event-jump work, finite manual-only state, boss/Golden exclusions, and exact/event-jump equality
  through 49 hours are regression-covered.
- Focused combat: 37/37; persistence V1–V4: 18/18; full `pnpm check`: 20 files, 181/181 tests,
  lint, format, Worker TypeScript, and production build passed.
- Independent review v4: APPROVE with no P0–P3 findings.
- Exact implementation commit `8c9bd65e3e377716542996654d77cd10d8a0deb1` passed CI run
  `33451548829` and Pages run `33451548786`.
- Independent deployed QA at `https://etherlords.github.io/autobattleidle/` passed V2 migration,
  manual and automatic visible HP/event transitions, normal → veteran → elite progression,
  `390×844` readability, V4 reload, and clean console/network checks. The served JS matched the
  successful Pages artifact byte-for-byte.
- Vault `AUTOBATTLEIDLE-DOC-20260827-A7FD1F#accepted-ordinary-enemy-health-calibration` records the
  accepted stage/logical-unit contract at content hash
  `e555fc785f095eb9ff37cb66abe2870552b8353040015ab12165b648f8bc9277`; bounded readback and
  `vault_doctor` completed with zero findings.

## Sign-off

- Reviewer: APPROVE — independent review v4
- QA: PASS — independent deployed QA v1
- Manager verification: PASS — acceptance mapped to code, tests, exact-SHA CI/Pages, deployed
  behavior, persistence, and canonical Vault evidence
- Manager close: PASS — all required gates and acceptance evidence are present; closure receipt is
  ready for the final Git checkpoint and exact-SHA CI/Pages publication
