---
plannerFormat: 1
id: ABI-034
artifact: analysis
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

# ABI-034 analysis

## Complexity and ownership

- **Complexity: XL.** This spans rights/provenance, binary assets, Web Audio lifecycle, streaming/buffering measurement, typed event integration, high-APS scheduling, accessible UI, separate persistence, browser audio QA, and deployed asset delivery.
- ABI-035 now owns the shared manual/automatic attack-source cue. ABI-034 consumes it and must not add a second attack classification seam. Audio alone owns playback; combat remains authoritative.
- Keep music and SFX in one task because they share the context, buses, lifecycle, settings, asset manifest, and audible QA. Splitting them would duplicate the riskiest ownership code.

## Verified current state

- The repository has no audio runtime, audio dependency, audio preference storage, or sound-settings UI. `src/app/application.ts` is the only cross-layer composition root; `BattleController` publishes typed events, `presentBattleUpdate` derives the current snapshot, `src/ui/hud.ts` owns accessible dialogs/intents, and `src/persistence` owns only canonical game saves. Audio therefore has one clean application-layer integration seam and must not be added to domain or Three.js units.
- `package.json` already ships browser-native TypeScript/Vite/Three.js and no audio framework. Native Web Audio supplies gain buses, scheduled ramps, buffers, and lifecycle control, so Howler or another dependency is not justified before a measured gap exists.
- All eight requested files exist. Together they are 33,361,832 bytes and 1,426.068 seconds (23:46.068). Their embedded tags identify artist `whimsicalmicrogenre7132`, `made with suno`, creation on 2026-08-30, and a distinct Suno generation ID. The four `Guardian's Watch` files have distinct durations/hashes and are not duplicates.
- Shipping rights are not proven by possession or metadata. Current Suno terms distinguish paid Pro/Premier output generated during the paid subscription from free/Basic output limited to personal non-commercial use with attribution. Preflight must record the account tier at each generation time before copying any MP3 into the repository.
- Browser autoplay policy requires creating or resuming `AudioContext` from a user gesture. `AudioContext.resume()` failure must remain a visible audio-only state; it cannot block combat startup.
- Source research: MDN Web Audio best practices documents gesture-gated context resume; `AudioParam.linearRampToValueAtTime` supports scheduled crossfades; Kenney assets are CC0 with optional attribution; jsfxr/sfxr is Unlicense/public-domain software; Freesound uses per-file CC0, CC-BY, or CC-BY-NC and therefore cannot be treated as one blanket-free library.
- Persistence impact is a **compatible separate preference document**, not a game-save schema change. Use a versioned audio-settings key with independent validation/reset. V1-V4 game payloads and migration source bytes remain untouched.

## Approach

- Add one `AudioService` port under `src/app/audio` and inject it from the application composition root. It owns exactly one lazily unlocked context, master/UI/combat/music gain buses, decoded SFX buffers, two music voices for crossfade, timers/listeners, voice priority/caps, and idempotent disposal.
- Route sound from typed controller/HUD events. Preserve semantic distinctions for UI, manual/automatic hit, critical, armor/deflect, family material, death, reward, boss, and Golden Bug. Do not parse event-log strings or let audio choose combat outcomes.
- Use deterministic playlist ordering across all approved tracks. Keep only the current and next music voice during a bounded equal-power or measured linear crossfade; retire the old voice once. Background/visibility resume must not create a second playlist owner.
- Keep combat audio readable under ABI-020 high APS with a small priority table and voice cap: death/boss/Golden/critical/armor outrank ordinary automatic hits; repeated low-priority hits may coalesce without changing combat or visual truth.
- Add one accessible settings dialog/section reusing existing modal focus and handoff behavior. Four native range inputs expose Master, UI, Combat, Music plus mute. Persist exact category values; master/mute multiply rather than overwrite them.
- Create a reviewed asset manifest before binary import. Prefer a minimal CC0/Unlicense SFX set; CC-BY needs exact attribution and CC-BY-NC is rejected for a potentially commercial game.

## Risks

- Suno tier/provenance uncertainty can make the requested MP3s non-shippable. Keep the task executable with a rights gate: no binary enters Git until evidence is recorded; a failed track is replaced or omitted explicitly, never silently relicensed.
- Decoding all 33.4 MB at startup may waste memory and delay interaction. Measure streaming `HTMLAudioElement` for music versus decoded buffers, preload only short SFX, and retain native platform behavior unless profiling proves otherwise.
- Autoplay, suspended tabs, rapid high-APS events, and overlapping crossfades can leak nodes or create audio storms. Bound voices, make unlock idempotent, and test visibility/resume/disposal repeatedly.
- Audio QA is not proved by screenshots or clean console alone. QA must record an audible `state -> action/time -> result` matrix and verify category isolation, mute, reload, failures, and no duplicate playback.
- Research URLs are evidence inputs, not redistributed assets: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices, https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/linearRampToValueAtTime, https://kenney.nl/support, https://github.com/chr15m/jsfxr, and https://freesound.org/help/faq/#licenses.
