---
plannerFormat: 1
id: ABI-034
artifact: brief
project: ABI
profile: high-assurance
revision: 3
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-008
  - ABI-011
  - ABI-013
  - ABI-023
  - ABI-035
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-034: Add licensed combat SFX, an eight-track music mixer, and persistent audio controls

## Goal

Add licensed combat SFX, an eight-track music mixer, and persistent audio controls

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] A reviewed asset manifest records source, creator, source URL or Suno generation ID, generation/download date, license or subscription tier at creation, attribution text, repository path, duration, byte size, and SHA-256 for every shipped music and SFX file; assets with unproven redistribution or commercial-use rights are excluded.
- [ ] All eight supplied Suno-tagged tracks are evaluated and, after rights verification, included without silent deduplication: Pastoral Loop, Idle Fantasy, Idle Dawn, Tran exploration, Guardian's Watch, and Guardian's Watch variants 1 through 3. The playlist uses deterministic non-repeating ordering and bounded crossfades with no overlap leak after pause, reset, reload, or disposal.
- [ ] One application-owned audio service uses native browser audio capabilities and owns context unlock, decode/preload, master/UI/combat/music gain buses, music sequencing, crossfades, bounded concurrent SFX voices, pause/resume, and idempotent disposal; domain, Three.js units, and DOM views never own an AudioContext or gameplay truth.
- [ ] Audio starts or resumes only after an accepted user gesture and exposes an accessible blocked/ready/error state; autoplay rejection, decode failure, missing files, and unsupported audio never block combat, corrupt saves, or create retry storms.
- [ ] Authored sound mapping distinguishes UI click, manual hit, automatic hit, critical, armor/deflect, death, reward, boss, Golden Bug, and representative material/family groups such as beetle shell and flesh. Mapping consumes existing typed combat/presentation events and does not infer outcomes from DOM text or duplicate combat rules.
- [ ] Manual and automatic high-APS combat remain audible without spam: a documented priority and voice-cap policy preserves critical, armor, death, boss, and Golden Bug cues while coalescing or dropping low-priority repeated hits; audio scheduling never changes damage, rolls, reward order, or visual cadence.
- [ ] An accessible sound settings surface provides Master, UI, Combat, and Music volume sliders plus mute, visible exact percentages, keyboard operation, and restored focus. Master multiplies each category without overwriting its saved category value.
- [ ] Audio preferences use a separate versioned localStorage key and strict validation/defaults; they survive reload and supported historical game-save migration, while game reset and corrupted audio preferences have explicit independently tested behavior and never silently reset valid game progress.
- [ ] Reduced-motion does not disable audio, but background-tab, visibility, focus, and page lifecycle behavior is explicit: music does not multiply on resume, suspended contexts recover only through allowed gestures, and all listeners, timers, nodes, buffers, and media elements are released once.
- [ ] The implementation adds no audio framework dependency unless a measured native-Web-Audio gap is documented during preflight. CC0 sources such as Kenney or generated sfxr/jsfxr may be used; Freesound assets require per-file license review and CC-BY attribution, while CC-BY-NC is excluded from a potentially commercial release.
- [ ] Focused tests cover preference validation, mixer math, source-to-cue mapping, priority/voice caps, deterministic playlist order, crossfade retirement, autoplay unlock, failures, visibility, reset/reload, and idempotent disposal. Browser QA proves sound controls and audible state on desktop and narrow layouts without console/network errors.
- [ ] Independent review, independent QA with an explicit audible state-action-result matrix, pnpm check, exact-SHA CI/Pages, public asset reachability, and deployed reload proof pass before Manager closure.

## Dependencies

- ABI-005
- ABI-008
- ABI-011
- ABI-013
- ABI-023
- ABI-035

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-E27CD3
- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-584401

## Constraints

- Follow the resolved workflow contract and project instructions.
