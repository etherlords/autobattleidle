---
plannerFormat: 1
id: ABI-056
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: Done
sprintId: ABI-S1
dependencies: []
parentId: null
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-056: Remove blocking Goose Hydra GLB semantic refresh lag

## Goal

Remove blocking Goose Hydra GLB semantic refresh lag

## Work item

- Type: bug
- Priority: high
- Status: Done
- Parent: None

## Acceptance criteria

- [ ] Boss GLB loading keeps the family-specific fallback hidden/loading and reveals the authored Goose Hydra only after a safe completed replacement; stale or disposed units cannot mutate the scene.
- [ ] Semantic surface rebuild no longer monopolizes the main thread for the measured multi-second interval: cached Goose Hydra transition must be non-blocking/deferred or bounded in work while preserving the authored semantic treatments and deterministic visual identity.
- [ ] Unit evidence covers the deferred/chunked semantic refresh lifecycle, completion, cancellation/stale guards, and exactly-once resource disposal without asserting implementation details.
- [ ] Integration evidence covers ordinary-to-boss/Goose transition timing, fallback-to-authored visibility, semantic refresh completion, replacement loops, and no regression to camera/effects lifecycle.
- [ ] Deployed evidence covers cold GLB network timing separately from post-fetch main-thread work on GitHub Pages and verifies production Goose Hydra at desktop and narrow viewports.
- [ ] Persistence remains a no-schema-change contract: existing V1/V2/V3/V4 saves, reload identity, and encoded DTO fields are unchanged.

## Dependencies

- None

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
