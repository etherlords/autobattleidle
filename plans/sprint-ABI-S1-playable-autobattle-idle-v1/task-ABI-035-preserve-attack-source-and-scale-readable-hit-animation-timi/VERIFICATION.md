---
plannerFormat: 1
id: ABI-035
artifact: verification
project: ABI
profile: high-assurance
revision: 1
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

# ABI-035 verification

## Acceptance evidence

- Exact candidate SHA `4ac3421770ad1369858bccb3b4c3f266400a8956` is published to `main`.
- The immutable cue preserves manual/automatic source, packet count, and effective packet units from
  controller through presenter, snapshot, battlefield, and effects without changing combat truth.
- Manual effects use 8 frames; automatic effects clamp to 6-12 frames from effective APS. Every
  lifetime completes the fixed authored trajectory and retires at zero opacity; reduced motion stays
  non-displacing.
- Focused attack-cue suite passed 42/42. Full `pnpm check` passed 20 files / 187 tests, lint, format,
  Worker typecheck, and production build. Independent review v2 approved with no P0-P3 findings.
- Persistence impact is no schema change: source and timing remain transient. Deployed V3 load,
  V4 publish, and reload preserved level 51+ progress without reset.
- Vault `AUTOBATTLEIDLE-DOC-20260827-584401#accepted-automatic-timing-and-pause-follow-ups` records
  the accepted contract at content hash
  `26d3747707197c1b89a3066f69c307a8134628537f3ea5ef492e5032adc52106`; Vault doctor reports zero
  findings.
- CI `33466759392` and Pages `33466759433` succeeded. Independent deployed QA passed desktop,
  390x844, manual/automatic source distinction, low/mid/10+ APS timing, critical/armor identity,
  reload compatibility, and clean console/network.

## Sign-off

- Reviewer: PASS — fresh independent review v2
- QA: PASS — exact-SHA deployed browser QA
- Verification: PASS — acceptance maps to code, tests, Vault, CI/Pages, and deployed behavior
- Manager close: pending terminal Planner checkpoint
