---
plannerFormat: 1
id: ABI-044
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-028
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-044 qa

## Verdict

PASS — independent deployed QA on exact SHA

`3eb13c213945db9cb4fc307750296f747888bdd8`

## Evidence

- Pages URL: `https://etherlords.github.io/autobattleidle/`
- CI run `33476780919`: success.
- Pages run `33476780923`: success.
- Armored encounter 36 migrated from raw armor 72 to 15; effective armor 12 at 15% penetration;
  automatic damage 19 with no 1-damage wall.
- Hardened encounter 48 migrated from raw armor 96 to 18; effective armor 14 at 19.4%
  penetration; automatic damage 23.
- Isolated V3/V4 fixtures retained HP fraction, coins, counters, player progress, and encounter after
  reload without reset.
- Zero-armor Golden Bug hid the mitigation row.
- Desktop 1440x900 and narrow 390x844 had no overflow; console had zero errors/warnings and no failed
  network requests; leaderboard worker update returned 204.
- Artifacts:
  - `.playwright-cli/page-2026-09-01T06-21-48-074Z.png`
  - `.playwright-cli/page-2026-09-01T06-20-26-833Z.png`
  - `.playwright-cli/page-2026-09-01T06-21-02-402Z.png`
