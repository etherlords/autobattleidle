---
plannerFormat: 1
id: ABI-033
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-032
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-033 qa

## Verdict

PASS — independent deployed QA verified ABI-033 on exact release SHA
`3dc4557f76a7fb6b00db2e53ef3c63c9e8519c14`.

## Evidence

- Public Pages: `https://etherlords.github.io/autobattleidle/`.
- Worker: `https://autobattleidle-leaderboard.etherlords.workers.dev`.
- Desktop and `390x844`: first open immediately showed `Community ranking — Your rank is #N`.
- Level/Golden Bugs and Top 100/Around Me remained separate rows; metric changes retained Around Me.
- Around Me showed current player #41 highlighted with ranks 31-41: ten above and zero below at the
  dataset edge.
- Table showed Place, Name, and the selected statistic without a duplicated rank number.
- Compact close button, Escape, backdrop click, focus restoration, and narrow layout passed.
- A delayed rename on a disposable identity disabled both tab rows, name input, Rename, and Delete;
  close remained enabled; controls restored after completion.
- Console had zero errors or warnings; relevant Worker requests returned 200/201.
- Artifacts: `output/playwright/abi033-mobile-top.png` and
  `output/playwright/abi033-mobile-around.png`.
- A repeated rename reached the external 429 rate limit as designed; no valued identity was deleted.
