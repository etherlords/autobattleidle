---
plannerFormat: 1
id: ABI-037
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-023
  - ABI-026
  - ABI-031
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-037 qa

## Verdict

PASS — independent browser QA verified the isolated visual lab and production-build boundary.

## Evidence

- Exact deterministic URLs reopened the selected family, grade, modifier, candidate recipe, animation, camera, viewport, and reduced-motion state.
- All production families plus boss and Golden Bug cases rendered with front/side/back/top/orbit controls, pause, frame step, replay speed, sockets, bounds, axes, and resource receipts.
- Desktop and narrow layouts remained usable; console was clean, requests were static-only, and storage remained empty.
- Serial replacement/disposal receipts returned to baseline and active effects stayed capped.
- `pnpm build:visual-lab` included the debug entry while `pnpm build` excluded it.

Evidence: `evt-13c5a9ff-a0ce-43c6-9df8-17af1620ab6b` and `output/playwright/abi037-{mantis-narrow,colossus-socket-probe,colossus-production,golden-narrow}.png`.
