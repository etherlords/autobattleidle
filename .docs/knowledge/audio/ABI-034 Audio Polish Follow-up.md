---
vaultFormat: 1
project: ABI
vaultId: ABI-DOC-20260903-FA2A0A
kind: history
status: active
summary: >-
  Loudness recalibration, softened cue mapping, 100% slider model, and playlist
  indicator for commit b56befa.
tags:
  - ABI-034
  - audio
  - autobattleidle
  - polish
---
# ABI-034 Audio Polish Follow-up

## Summary

Loudness recalibration, softened cue mapping, 100% slider model, and playlist indicator for commit b56befa.

## Change summary

Commit `b56befaf579a20eeb58719ec7799f1cd70c63dda` softened combat and UI cues, separated startup loudness from the 100% sliders, and added a Now playing / Next track indicator to the sound settings dialog.

## Cue mapping

Automatic critical is a muted heavy punch, automatic hit is one wood knock, manual critical is a low dull bell, armor is a glass thud, death is wood, boss uses the soft heavy impact, Golden Bug kill uses the coin confirmation, and the UI click uses the soft scroll cue.

## Loudness model

Sliders are user-facing positions that default to 100%. The service multiplies each by invisible calibration bases: master 0.75, UI 0.2, combat 0.05, music 0.1. Persisted audio settings remain an independent versioned document.

## Verification

Focused run: 7 files / 69 tests pass. Full `pnpm check`: 31 files / 303 tests, worker tsc, vite build pass. CI `33801195266` and Pages `33801195292` succeeded for the exact commit. Deployed URL shows all sliders at 100%, `Audio ready.` after the first gesture, and `Now playing: Pastoral Loop · Next: Idle Fantasy`.

## Limitation

Headless verification cannot prove audible loudness; base gains await user listening feedback.

## Related

- [[audio/ABI-034 Audio Runtime and Rights|ABI-034 Audio Runtime and Rights]]
