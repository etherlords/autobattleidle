---
plannerFormat: 1
id: ABI-030
artifact: analysis
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

# ABI-030 analysis

## Verified current state

- The product is a static Vite/Three.js app deployed on GitHub Pages. It has no backend,
  service worker, remote data owner, Firebase/Cloudflare dependency, environment contract,
  or repository deployment secret.
- `src/app/application.ts` owns composition and current combat state. `src/ui/hud.ts` owns
  input isolation and composes `UpgradeDialog`; that dialog owns the existing launcher,
  modal, Escape/backdrop handling, focus loop, keyboard shortcut, and disposal pattern.
- V3 game persistence is owned by `src/persistence/save/*`. Leaderboard identity must use
  a separate storage key so valid V1/V2/V3 saves and game reset remain byte-compatible.
- Vault's strict fresh knowledge search returned `confidence=none`; ABI-030 must create the
  first durable leaderboard decision/runbook before closure.
- The local Cloudflare CLI is not authenticated and the repository has no deployment
  secrets. Implementation and local proof can proceed, but live Worker/D1 provisioning and
  deployed QA require an authorized Cloudflare login or repository token later in this task.

## Provider decision

Select Cloudflare Worker + D1.

- Firebase Anonymous Auth gives a managed stable UID and App Check, while Firestore offers
  50,000 reads and 20,000 writes per day on one free database. The required server-owned
  function adds Firebase/Google project, Auth, Firestore rules/indexes, Functions/IAM, App
  Check, and billing-plan operations; Cloud Functions deployment is the larger operational
  surface for this already-static project.
- Cloudflare keeps the backend in the repository's existing TypeScript/runtime model: one
  Worker, one D1 database, migrations, and standard `fetch`. D1/Workers have bounded free
  quotas, Worker rate-limit bindings support keyed limits, Wrangler has explicit deployment
  rollback, and GitHub Pages can call the Worker over narrow CORS.
- Rollback is Worker version rollback plus a forward-only compensating D1 migration. The
  frontend endpoint is build-time configuration; removing it restores an offline-only game.
- No provider makes client-supplied idle progress cheat-proof. The board is an explicitly
  untrusted community ranking; server validation, bearer identity, monotonic updates, rate
  limits, and optional Turnstile reduce abuse but do not prove gameplay.

## Approach

- Worker issues a random 256-bit bearer token once. D1 stores only its SHA-256 hash, a
  generated collision-safe display name, best level, rename time, and timestamps. The
  client stores the token and public identity separately from the game save.
- API: create identity, get Top 100, get bounded Around Me, submit monotonic best level,
  rename, and delete/reset. Every write validates JSON/content type, token, origin, bounds,
  rate limits, and atomic D1 constraints. Network rate keys are HMAC hashes; raw IPs are not
  retained. Names are server-normalized, allowlisted, filtered, uniquely disambiguated, and
  rename-cooled down.
- Ranking is `best_level DESC, achieved_at ASC, id ASC`. Top is limited to 100. Around Me
  returns at most 100 above and 100 below plus the current row using bounded indexed queries.
- Reuse the HUD launcher/modal behavior and `formatNumber`; while the leaderboard modal is
  open, battlefield input remains isolated. Required states are loading, empty, offline,
  rate-limited, and generic failure. Showing every player is skipped.
- Persistence impact: **no game schema change**. Add a separate leaderboard identity key;
  prove supported historical V1/V2/V3 load-save-reload remains unchanged.

## Risks

- A copied bearer token can impersonate an identity; deletion is irreversible and rename
  cooldown is server time. Multiple browsers/devices intentionally create separate identities.
- Per-network limits can affect shared NAT users and cannot stop distributed abuse. Turnstile
  is optional only when configured because no widget/site secret exists yet.
- D1 query cost is bounded by indexes and fixed limits; retained rows are deleted on explicit
  reset and otherwise kept while the community board exists. No personal data is requested.
- Cross-origin calls must allow only the production Pages origin plus explicit local origins;
  secrets and administrative endpoints must never ship in the browser bundle.
- Deployment is blocked until Cloudflare authorization exists; do not substitute a client
  database write or unreviewed temporary backend.
