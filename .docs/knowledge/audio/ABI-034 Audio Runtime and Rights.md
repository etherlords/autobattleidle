---
vaultFormat: 1
project: ABI
vaultId: ABI-DOC-20260903-60F3BF
kind: architecture
status: active
summary: >-
  ABI-034 native audio mixer, licensed asset provenance, gesture unlock,
  persistence, and deployed QA evidence.
tags:
  - ABI-034
  - audio
  - autobattleidle
  - rights
  - qa
---
# ABI-034 Audio Runtime and Rights

## Summary

ABI-034 native audio mixer, licensed asset provenance, gesture unlock, persistence, and deployed QA evidence.

## Decision

ABI-034 uses one application-owned native Web Audio service. It owns lazy AudioContext unlock, Master/UI/Combat/Music gain buses, bounded SFX voices, deterministic eight-track HTMLAudioElement sequencing, crossfades, visibility suspension, and idempotent disposal. The HUD owns only the accessible settings dialog and a responsive launcher row.

## Persistence

Audio preferences are a separate versioned `autobattleidle.audio-settings` document. Master, UI, Combat, Music, and mute values validate independently and never change the V1-V4 game-save payload.

## Rights

Music provenance is recorded in `public/audio/manifest.json` with Suno generation IDs, source-file dates, bytes, durations, hashes, and policy links. The supplied account evidence record is `public/audio/music/SUNO-PRO-EVIDENCE.md`. Kenney UI/combat files are CC0 and carry attribution/license receipts under `public/audio/sfx/`.

## Verification

The application starts audio blocked and unlocks on a user gesture; failed unlocks remain retryable. Production proof for commit `5e791a0c94a95d60263cfeb6af8ecb1b3844a652`: CI `33779376141`, Pages `33779376114`, public URL `https://etherlords.github.io/autobattleidle/`. Browser QA verified explicit blocked/ready status, music/SFX requests, physical mute and sliders, persistence, 390px no-overlap/no-overflow, 8.34 APS bounded activity, and bounded routed music failures. Headless browsers cannot prove audible output; real hidden-tab lifecycle was not available and remains covered by the service visibility tests.

## Related



- [[design/UI, Persistence, and QA|UI, Persistence, and QA]]
- [[audio/ABI-034 Audio Polish Follow-up|ABI-034 Audio Polish Follow-up]]
- [[architecture/Technical Architecture|Technical Architecture]]
