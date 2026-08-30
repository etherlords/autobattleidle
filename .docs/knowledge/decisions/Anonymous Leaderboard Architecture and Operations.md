---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260830-86F521
kind: decision
status: active
summary: >-
  Cloudflare Worker and D1 decision, anonymous identity and privacy contract,
  ranking limits, and deployment rollback runbook.
tags:
  - leaderboard
  - cloudflare
  - d1
  - privacy
  - operations
---
# Anonymous Leaderboard Architecture and Operations

## Summary

Cloudflare Worker and D1 decision, anonymous identity and privacy contract, ranking limits, and deployment rollback runbook.

## Decision

Use one Cloudflare Worker with one D1 database. This narrowly amends the earlier V1 no-backend boundary for the optional community leaderboard only; combat, progression, and game saves remain offline-first.

Firebase Anonymous Auth, Firestore, Functions, IAM, rules, indexes, App Check, and billing operations were rejected for this static GitHub Pages game because they add a larger operational surface. The Worker path keeps the backend in TypeScript, exposes only a small HTTP API, and supports explicit version rollback.

The browser never writes directly to D1 and never contains an administrative secret.

## Trust boundary

The leaderboard is an untrusted community ranking. Client-only idle progression can be replayed or modified, so submitted levels cannot be made cheat-proof. Server validation, monotonic updates, bearer identity, rate limits, bounded queries, and optional future attestation reduce abuse but do not prove legitimate gameplay.

Ranking order is deterministic: best level descending, achievement time ascending, then player ID ascending.

## Anonymous identity and privacy

On first use, the Worker creates a random 256-bit bearer token and a readable generated name. The browser stores that identity under a leaderboard-only localStorage key; V1, V2, and V3 game saves remain unchanged.

D1 stores only:

- the SHA-256 token hash;
- the generated or renamed display name;
- best level;
- rename, achievement, creation, and update timestamps.

Network limits use an HMAC of the connecting IP. Raw IP addresses are not retained. A copied bearer token can impersonate that leaderboard identity; the ranking must not be used for rewards, account recovery, or security decisions.

## Retention, deletion, and devices

A leaderboard row is retained while the community board exists unless the player explicitly deletes it. Delete removes the player row and identity-derived rate-limit rows. Expired network rate-limit rows are pruned by the bounded rate path.

Each browser profile creates a separate identity. Reload keeps the same identity. A second device is intentionally a different player unless its bearer token is copied manually; there is no account merge or recovery flow.

## Names and rate limits

Names are normalized with NFKC, trimmed, whitespace-collapsed, length-limited, character-allowlisted, and checked for reserved or profane terms. Generated-name and rename collisions are retried with deterministic disambiguation. Rename cooldown is enforced by one conditional D1 update, so concurrent requests cannot both bypass it.

Create, read, and write requests use separate per-network and per-identity limits. Counter increments are atomic per key. The board has a 10,000-player ceiling.

## Views and cost bounds

Top returns at most 100 rows. Around Me returns the current player plus at most 100 rows above and 100 below using indexed keyset queries. Exact rank remains bounded by the 10,000-player ceiling and ranking reads are rate-limited. Showing every player is not part of this design.

## Deployment runbook

Local migration and Worker development do not require a Cloudflare account:

1. Apply migrations with pinned Wrangler 4.127.1 in local mode.
2. Start local Worker development with explicit local allowed-origin and IP-HMAC values.
3. Exercise identity creation, score, Top, Around Me, rename, and deletion.

Remote deployment requires a Cloudflare account. Use interactive `wrangler login` for an authorized manual deployment, or configure CI with scoped `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

Provision and release in this order:

1. Create the D1 database and replace the checked placeholder in `wrangler.toml` with the returned non-secret database ID.
2. Configure `LEADERBOARD_IP_HASH_KEY` and Cloudflare credentials as GitHub secrets.
3. Configure `LEADERBOARD_ALLOWED_ORIGINS` and the Pages `LEADERBOARD_API_URL` as repository variables.
4. Apply D1 migrations to the explicit remote database.
5. Upload the IP-HMAC key as a Worker secret.
6. Deploy the Worker with the pinned Wrangler version.
7. Build Pages with `VITE_LEADERBOARD_API` from the configured endpoint.
8. Verify the deployed Worker and Pages flow at desktop and narrow viewport.

The workflows fail closed while the D1 ID, endpoint, origins, credentials, or secret are missing.

## Rollback

Roll back Worker code to a known version. D1 migrations are forward-only; use a reviewed compensating migration instead of destructive rollback. Removing the Pages endpoint disables the leaderboard while preserving the offline game and its existing saves.

## Required release evidence

A release requires focused contract tests, strict Worker TypeScript, the canonical project check, a real D1 migration and API smoke, independent review, deployed browser QA, exact-SHA CI and Pages proof, the exact Worker version, and public identity, submit, Top, Around Me, rename, rate-limit, and deletion evidence.

## Related



- [[operations/Release and Deployment Operations|Release and Deployment Operations]]
- [[architecture/Technical Architecture|Technical Architecture]]
- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
