---
plannerFormat: 1
id: ABI-030
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-008
  - ABI-012
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-030: Add a privacy-safe anonymous leaderboard with Top 100 and Around Me views

## Goal

Add a privacy-safe anonymous leaderboard with Top 100 and Around Me views

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] A recorded architecture decision compares Firebase Anonymous Auth plus server function and Firestore against Cloudflare Worker plus D1 on anonymous identity, abuse controls, free-tier limits, operational effort, privacy, Pages integration, and rollback; one minimal backend is selected before implementation.
- [ ] The public client never writes a claimed level directly to the database and contains no administrative secret. A server-owned endpoint validates shape and bounds, applies per-identity and per-network rate limits, uses platform attestation when practical, and performs monotonic best-level updates.
- [ ] The design explicitly states that client-only idle progression cannot be cheat-proof. The leaderboard is treated as an untrusted community ranking, with documented replay/tamper limits and no false security claim.
- [ ] Only a pseudonymous generated display name, anonymous stable identifier or salted hash, best level, and necessary timestamps are retained; deletion/reset, retention, duplicate-device, and privacy behavior are documented.
- [ ] A Leaderboard launcher appears beside Upgrades and opens an accessible modal reusing the existing dialog, focus, Escape, backdrop, keyboard, responsive, and input-isolation behavior.
- [ ] The modal provides Top 100 and Around Me views. Around Me shows the current rank and a bounded neighborhood of up to 100 entries above and below; deterministic tie-breaking, empty/loading/offline/rate-limited states, and compact large-number display are defined.
- [ ] Showing every player is optional and is added only if bounded cursor pagination, privacy, abuse, and query-cost evidence justify it; Top 100 plus Around Me is the required usable baseline.
- [ ] Contract tests cover validation, authorization, monotonic updates, ties, pagination bounds, rate limiting, and failures; UI tests cover modal/accessibility/isolation; independent review and browser QA verify desktop/narrow behavior and deployed frontend/backend evidence.

## Dependencies

- ABI-006
- ABI-008
- ABI-012

## Related knowledge

- None

## Constraints

- Follow the resolved workflow contract and project instructions.
