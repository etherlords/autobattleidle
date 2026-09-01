---
plannerFormat: 1
id: ABI-034
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-008
  - ABI-011
  - ABI-013
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-034 implementation-guide

## Frozen scope

- Add licensed music/SFX, native mixer ownership, persistent audio preferences, accessible controls, and audible verification only. Do not redesign combat, animation, save V4, leaderboard, or visual factories.
- Start with the rights manifest. Supplied MP3s may be copied only after Suno subscription-at-generation evidence proves the intended distribution use. No new audio dependency without a measured native gap and review.
- Ownership: `src/app/audio` schedules audio; controller/HUD emit typed events; `src/ui` renders controls; a separate preference adapter validates localStorage; public assets and their license manifest live under explicit repository-owned paths.
- Default safe state: preferences load with documented defaults, mute is reversible, audio failure is non-fatal, and playback begins only after a gesture.

## Implementation sequence

1. Produce an asset inventory with filename, duration, bytes, SHA-256, embedded Suno ID, provenance, subscription tier, allowed use, attribution, and decision. Select the smallest CC0/Unlicense SFX candidates and retain source receipts.
2. Freeze typed audio event and settings contracts. Decide measured music streaming/buffering, crossfade duration/curve, SFX voice cap/priority, high-APS coalescing, visibility policy, and reset semantics.
3. Implement the versioned audio preference adapter with strict finite `[0,1]` validation, defaults, malformed-data fallback, independent reset, and storage-failure handling.
4. Implement the injected audio service using native Web Audio gain buses and scheduled ramps. Make unlock, play, suspend/resume, track advance, error handling, and disposal idempotent.
5. Wire controller/HUD events once at `startApplication`; add controls through existing dialog/focus patterns; never parse DOM/event text.
6. Add approved assets and a machine-checkable manifest. Verify Vite base paths, hashes, production MIME/range behavior, cache behavior, and Pages reachability.
7. Run focused tests, full `pnpm check`, independent review, audible browser QA, Vault contract updates, and exact-SHA deployment proof.

## Verification matrix

- **Unit:** preference parsing/defaults; gain multiplication/mute; deterministic playlist; crossfade retirement; cue mapping; priorities/voice cap; unlock/error/visibility/disposal state machine.
- **Integration:** one application subscription; manual/automatic/critical/armor/death/reward/boss/Golden events; high-APS coalescing without combat changes; UI focus/keyboard; separate localStorage reload/reset; current and V1-V4 save compatibility.
- **Asset/legal:** every shipped file matches manifest hash and provenance; Suno tier evidence exists; CC-BY attribution renders when used; CC-BY-NC and unknown rights are absent.
- **Browser/deployed:** first gesture unlock, category sliders, mute/unmute, track order/crossfade, background/resume, failure fallback, desktop/390px layout, clean console/network, public assets at exact SHA, and audible state-action-result receipts.

## Fresh preflight gate 2026-09-01

- Do not advance ABI-034 to `In Progress` while the Suno subscription tier at the embedded 2026-08-30 generation timestamps is unproven.
- Acceptable unblock evidence is a dated billing/subscription receipt or authoritative account history showing Pro/Premier covered those timestamps. A current subscription alone is insufficient.
- If the evidence shows Basic or remains unavailable, exclude all affected MP3s and return to product planning for eight replacement tracks with explicit redistribution/commercial-use provenance; do not reinterpret possession, download access, or embedded generation IDs as a license.
- Once rights are proven, copy from the read-only Downloads sources into the repository through the reviewed manifest workflow, then verify every copied SHA-256 against the fresh inventory before implementation proceeds.
