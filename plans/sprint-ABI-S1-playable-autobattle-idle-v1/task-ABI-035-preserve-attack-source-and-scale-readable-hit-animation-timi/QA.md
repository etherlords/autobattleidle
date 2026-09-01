---
plannerFormat: 1
id: ABI-035
artifact: qa
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

# ABI-035 qa

## Verdict

PASS — independent deployed QA at exact SHA
`4ac3421770ad1369858bccb3b4c3f266400a8956`.

## Evidence

- CI `33466759392` and Deploy GitHub Pages `33466759433` completed successfully for the exact SHA.
- Public URL: `https://etherlords.github.io/autobattleidle/`.
- Deployed desktop 1440x900 and narrow 390x844 contexts visibly distinguished `Manual hit` from
  `Automatic hit`; Armored and Vital identities remained visible.
- Focused timing receipts proved 12-frame low-APS, 9-frame mid-APS, and 6-frame high-APS effects;
  packet aggregation, critical/armor identity, lethal ordering, reduced motion, replacement, and
  retirement stayed covered by controller, presenter, battlefield, and effects tests.
- A production-codec V3 fixture loaded without reset, migrated to V4, retained level 51+ progress,
  and remained V4 after reload.
- Full `pnpm check` passed lint, format, 20 files / 187 tests, Worker typecheck, and production build.
- Console contained no errors and the network had no failed resources.
- Artifacts: `output/playwright/abi035-desktop.png` and
  `output/playwright/abi035-mobile.png`.
- QA used disposable browser contexts and did not access the user's Chrome or localStorage.
