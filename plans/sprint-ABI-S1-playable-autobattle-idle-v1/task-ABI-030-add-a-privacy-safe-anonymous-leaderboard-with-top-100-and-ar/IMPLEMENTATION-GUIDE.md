---
plannerFormat: 1
id: ABI-030
artifact: implementation_guide
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

# ABI-030 implementation-guide

## Frozen scope

- Exactly ABI-030: Cloudflare Worker + D1 API, migration/config, separate client identity
  boundary, Leaderboard HUD modal, focused tests, Vault decision/runbook, and deployment.
- Required views: Top 100 and Around Me (up to 100 above and 100 below), current rank,
  generated name, rename, submission, deletion/reset, and explicit loading/empty/offline/429/error.
- Excluded: global player browsing, social login, gameplay attestation claims, moderation UI,
  analytics, paid services, game-save schema changes, ABI-020/028/029 changes, and new UI libraries.

## Implementation sequence

1. Add the smallest Worker module, D1 schema/migration, environment bindings, CORS/auth/body
   validation, name policy, atomic monotonic submit/rename/delete, indexed ranking queries,
   and identity/network rate limits. Use Web Crypto and platform APIs; no server framework.
2. Add a typed browser client that creates/reuses one bearer identity in its own localStorage
   key and exposes load, submit, rename, and delete without owning combat or save state.
3. Add a Leaderboard dialog beside Upgrades. Reuse current modal lifecycle and number format;
   isolate battlefield input, preserve focus/Escape/backdrop/keyboard/disposal semantics, and
   render only bounded text nodes.
4. Wire the current encounter from snapshots to monotonic submission without blocking combat.
   Network failure remains a visible leaderboard state, never a game failure.
5. Add one contract suite for API/auth/rate/name/rank behavior and focused HUD/application
   tests for modal, rename, isolation, reload, cleanup, and failure states. Run focused tests,
   `pnpm check`, and the supported historical-save regression.
6. Independent Reviewer, one bounded repair/re-review if needed, independent browser QA,
   Vault decision/runbook sync, scoped commit/push, Cloudflare deploy, exact-SHA CI/Pages,
   public Worker + Pages proof, Manager close, and lease release.

## Verification matrix

- Unit: request/body/token/name validation; generated-name collision handling; reserved/profanity
  rejection; rename cooldown; identity and network 429; monotonic update; deterministic ties;
  Top 100 and Around Me bounds; delete; CORS; no raw network identifier persistence.
- Integration: client token/name reload; app encounter submission; modal keyboard/focus/backdrop
  and battlefield isolation; offline/empty/429/error; desktop/narrow DOM; V1/V2/V3 game-save
  load-save-reload unchanged.
- Deployed: production Pages origin only, identity creation, generated name, rename, monotonic
  submit, Top 100, Around Me/current rank, tie order, deletion/reset, 429 evidence, desktop and
  390px interaction, clean console/network, exact Worker version and exact frontend SHA.
