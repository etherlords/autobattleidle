import type { BattleVisualCue } from "../../domain/snapshot";
import {
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  saveAudioPreferences,
  type AudioPreferences,
  type AudioPreferencesStorage,
} from "./audio-preferences";
import {
  cueFromBattleVisualCue,
  resolveCueBuffer,
  uiCueBuffer,
  type AudioCue,
  type UiCueName,
} from "./cues";

export type AudioServiceState = "blocked" | "ready" | "error" | "suspended" | "disposed";

export type AudioManifestEntry = { readonly file: string; readonly title?: string };

export type AudioServiceManifest = {
  readonly music: readonly AudioManifestEntry[];
};

export type AudioServiceDeps = {
  readonly context?: AudioContext;
  readonly storage?: AudioPreferencesStorage;
  readonly manifest: AudioServiceManifest;
  readonly mediaElementFactory?: (src: string) => HTMLAudioElement;
  readonly onStateChange?: (state: AudioServiceState) => void;
};

type SfxCategory = "ui" | "combat";

export type ActiveVoiceHandle = {
  readonly priority: number;
  readonly source: AudioBufferSourceNode;
};

type MusicVoice = {
  readonly element: HTMLAudioElement;
  readonly gain: GainNode;
  readonly sourceNode: MediaElementAudioSourceNode;
};

const VOICE_CAP = 6;
const CROSSFADE_SECONDS = 1.5;
const FRAME_MS = 16;

// Invisible loudness calibration: persisted slider positions multiply these
// base gains, keeping first-run audio soft while the UI always shows the real
// user-facing percentage.
const BASE_MASTER_GAIN = 0.75;
const BASE_UI_GAIN = 0.2;
const BASE_COMBAT_GAIN = 0.05;
const BASE_MUSIC_GAIN = 0.1;

const PRIORITY_TOP = 3;
const PRIORITY_HIGH = 2;
const PRIORITY_MANUAL = 1;
const PRIORITY_AUTOMATIC = 0;

const SFX_URL_PREFIX = "audio/sfx";

const cuePriority = (cue: AudioCue): number => {
  if (cue.type === "scene") {
    if (cue.name === "death" || cue.name === "boss" || cue.name === "golden-kill")
      return PRIORITY_TOP;
    return PRIORITY_HIGH;
  }
  if (cue.type !== "attack") return PRIORITY_HIGH;
  if (cue.kind === "critical" || cue.kind === "armor") return PRIORITY_HIGH;
  if (cue.source === "manual") return PRIORITY_MANUAL;
  return PRIORITY_AUTOMATIC;
};

export class AudioService {
  private prefs: AudioPreferences;
  private state: AudioServiceState = "blocked";
  private context: AudioContext | null;
  private readonly ownsContext: boolean;
  private readonly storage: AudioPreferencesStorage | undefined;
  private readonly manifest: AudioServiceManifest;
  private readonly mediaElementFactory: (src: string) => HTMLAudioElement;
  private readonly onStateChange: ((state: AudioServiceState) => void) | undefined;
  private readonly stateListeners = new Set<(state: string) => void>();

  private masterGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private combatGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private readonly bufferCache = new Map<string, Promise<AudioBuffer | null>>();
  private readonly voiceHandles: ActiveVoiceHandle[] = [];
  private readonly uiClickSources = new Set<AudioBufferSourceNode>();
  private readonly musicVoices: MusicVoice[] = [];
  private readonly retiringMusicVoices = new Set<MusicVoice>();
  private readonly crossfadeTimers = new Set<ReturnType<typeof setTimeout>>();
  private trackIndex = 0;
  private playlistActive = false;
  private lastAutomaticFrame = -1;
  private uiClickRequest = 0;
  private automaticAlternation = 0;
  private manualAlternation = 0;
  private resumeFailures = 0;
  private failedTracksInRun = 0;

  constructor(deps: AudioServiceDeps) {
    this.context = deps.context ?? null;
    this.ownsContext = deps.context === undefined;
    this.storage = deps.storage;
    this.manifest = deps.manifest;
    this.mediaElementFactory = deps.mediaElementFactory ?? ((src) => new Audio(src));
    this.onStateChange = deps.onStateChange;
    this.prefs = deps.storage ? loadAudioPreferences(deps.storage) : DEFAULT_AUDIO_PREFERENCES;
  }

  get currentState(): AudioServiceState {
    return this.state;
  }

  get preferences(): AudioPreferences {
    return this.prefs;
  }

  get activeVoices(): readonly ActiveVoiceHandle[] {
    return this.voiceHandles;
  }

  subscribeState(listener: (state: string) => void): () => void {
    if (this.state === "disposed") {
      listener(this.state);
      return () => undefined;
    }
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  get playlist(): { readonly current: string; readonly next: string } | null {
    if (this.manifest.music.length === 0 || !this.playlistActive) return null;
    const current = this.manifest.music[this.trackIndex];
    const next = this.manifest.music[(this.trackIndex + 1) % this.manifest.music.length];
    if (current === undefined || next === undefined) return null;
    const label = (entry: AudioManifestEntry, file: string): string =>
      entry.title ??
      file
        .split("/")
        .at(-1)
        ?.replace(/\.[a-z0-9]+$/i, "") ??
      file;
    return { current: label(current, current.file), next: label(next, next.file) };
  }

  get musicVoiceCount(): number {
    return this.musicVoices.length;
  }

  get currentTrackIndex(): number {
    return this.trackIndex;
  }

  async unlock(): Promise<boolean> {
    if (this.state === "disposed" || this.state === "ready") return this.state === "ready";
    if (this.state === "error" && this.resumeFailures > 1) return false;

    if (this.context === null) {
      const Ctor = window.AudioContext;
      if (typeof Ctor !== "function") {
        this.setState("error");
        return false;
      }
      try {
        this.context = new Ctor();
      } catch {
        this.setState("error");
        return false;
      }
    }

    const context = this.context;
    if (context === null) return false;
    this.attachGraph(context);

    try {
      if (context.state !== "running") await context.resume();
    } catch {
      this.resumeFailures += 1;
      this.setState("error");
      return false;
    }

    this.setState("ready");
    if (this.playlistActive) this.resumeMusicVoices();
    return true;
  }
  async startAudio(): Promise<boolean> {
    const unlocked = await this.unlock();
    if (unlocked) this.startMusic();
    return unlocked;
  }

  setPreferences(prefs: AudioPreferences): void {
    this.prefs = prefs;
    this.applyGains();
    saveAudioPreferences(this.storage, prefs);
    for (const listener of [...this.stateListeners]) listener(this.state);
  }

  setMuted(muted: boolean): void {
    this.setPreferences({ ...this.prefs, muted });
  }

  playBattleCues(cues: readonly BattleVisualCue[]): void {
    for (const cue of cues) {
      const bufferName = cueFromBattleVisualCue(cue, this.alternationFor(cue));
      if (bufferName === null) continue;
      const audioCue: AudioCue =
        typeof cue === "string"
          ? { type: "scene", name: cue }
          : { type: "attack", kind: cue.kind, source: cue.source };
      if (this.isCoalescedAutomatic(audioCue)) continue;
      void this.playSfx(bufferName, cuePriority(audioCue), "combat");
    }
  }

  playUiCue(name: UiCueName): void {
    const bufferName = uiCueBuffer(name);
    if (bufferName === null) return;
    const latestRequest = name === "click" ? ++this.uiClickRequest : undefined;
    void this.playSfx(bufferName, PRIORITY_HIGH, "ui", latestRequest);
  }

  playCue(cue: AudioCue, batchIndex = 0): void {
    const bufferName = resolveCueBuffer(cue, batchIndex);
    if (bufferName === null) return;
    void this.playSfx(bufferName, cuePriority(cue), cue.type === "ui" ? "ui" : "combat");
  }

  startMusic(): void {
    if (this.playlistActive || this.state !== "ready") return;
    if (this.manifest.music.length === 0) return;
    this.playlistActive = true;
    this.trackIndex = 0;
    this.failedTracksInRun = 0;
    const first = this.manifest.music[0];
    if (first === undefined) return;
    this.spawnMusicVoice(first.file, 1);
    for (const listener of [...this.stateListeners]) listener(this.state);
  }

  stopMusic(): void {
    this.playlistActive = false;
    const voices = this.musicVoices.splice(0);
    for (const voice of voices) this.retireMusicVoice(voice, 0);
  }

  dispose(): void {
    if (this.state === "disposed") return;
    this.state = "disposed";
    this.playlistActive = false;
    this.clearCrossfadeTimers();
    this.stopAllVoices();
    this.teardownAllMusic();
    this.disconnectGraph();
    this.stateListeners.clear();
  }

  private clearCrossfadeTimers(): void {
    for (const timer of this.crossfadeTimers) clearTimeout(timer);
    this.crossfadeTimers.clear();
  }

  private stopAllVoices(): void {
    for (const voice of this.voiceHandles) {
      voice.source.onended = null;
      try {
        voice.source.stop();
      } catch {
        // already stopped
      }
      voice.source.disconnect();
    }
    this.voiceHandles.length = 0;
  }

  private teardownAllMusic(): void {
    const voices = new Set([...this.musicVoices, ...this.retiringMusicVoices]);
    for (const voice of voices) this.teardownMusicVoice(voice);
    this.musicVoices.length = 0;
    this.retiringMusicVoices.clear();
  }

  private disconnectGraph(): void {
    this.masterGain?.disconnect();
    this.uiGain?.disconnect();
    this.combatGain?.disconnect();
    this.musicGain?.disconnect();
    this.masterGain = null;
    this.uiGain = null;
    this.combatGain = null;
    this.musicGain = null;
    const context = this.context;
    this.context = null;
    if (context !== null && this.ownsContext) {
      void context.close().catch(() => undefined);
    }
  }

  private setState(state: AudioServiceState): void {
    this.state = state;
    this.onStateChange?.(state);
    for (const listener of [...this.stateListeners]) listener(state);
  }

  private attachGraph(context: AudioContext): void {
    if (this.masterGain !== null) return;
    this.masterGain = context.createGain();
    this.uiGain = context.createGain();
    this.combatGain = context.createGain();
    this.musicGain = context.createGain();
    this.uiGain.connect(this.masterGain);
    this.combatGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.masterGain.connect(context.destination);
    this.applyGains();
  }

  private applyGains(): void {
    if (this.masterGain === null) return;
    this.masterGain.gain.value = this.prefs.muted ? 0 : this.prefs.master * BASE_MASTER_GAIN;
    if (this.uiGain !== null) this.uiGain.gain.value = this.prefs.ui * BASE_UI_GAIN;
    if (this.combatGain !== null) this.combatGain.gain.value = this.prefs.combat * BASE_COMBAT_GAIN;
    if (this.musicGain !== null) this.musicGain.gain.value = this.prefs.music * BASE_MUSIC_GAIN;
  }

  private alternationFor(cue: BattleVisualCue): number {
    if (typeof cue === "string") return 0;
    if (cue.source === "manual") {
      const alternation = this.manualAlternation;
      this.manualAlternation += 1;
      return alternation;
    }
    return this.automaticAlternation;
  }

  private isCoalescedAutomatic(cue: AudioCue): boolean {
    if (cue.type !== "attack" || cue.source !== "automatic" || cue.kind !== "hit") return false;
    const frame = Math.round(performance.now() / FRAME_MS);
    if (frame === this.lastAutomaticFrame) return true;
    this.lastAutomaticFrame = frame;
    this.automaticAlternation += 1;
    this.manualAlternation += 1;
    return false;
  }

  private async playSfx(
    bufferName: string,
    priority: number,
    category: SfxCategory,
    latestRequest?: number,
  ): Promise<void> {
    if (this.state !== "ready" || this.context === null) return;
    const buffer = await this.loadBuffer(bufferName);
    if (
      buffer === null ||
      this.state !== "ready" ||
      this.context === null ||
      (latestRequest !== undefined && latestRequest !== this.uiClickRequest)
    )
      return;
    this.startVoice(buffer, priority, category, latestRequest !== undefined);
  }

  private async loadBuffer(bufferName: string): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(bufferName);
    if (cached !== undefined) return cached;
    const pending = fetch(`${SFX_URL_PREFIX}/${bufferName}.ogg`)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((bytes) => {
        const context = this.context;
        if (bytes === null || context === null) return null;
        return context.decodeAudioData(bytes);
      })
      .catch(() => null);
    this.bufferCache.set(bufferName, pending);
    return pending;
  }

  private startVoice(
    buffer: AudioBuffer,
    priority: number,
    category: SfxCategory,
    exclusive = false,
  ): void {
    const context = this.context;
    const bus = category === "ui" ? this.uiGain : this.combatGain;
    if (context === null || bus === null) return;

    if (exclusive) this.stopExclusiveUiClicks();

    if (this.voiceHandles.length >= VOICE_CAP) {
      let victimIndex = -1;
      let victimPriority = priority;
      this.voiceHandles.forEach((voice, index) => {
        if (voice.priority < victimPriority) {
          victimPriority = voice.priority;
          victimIndex = index;
        }
      });
      if (victimIndex < 0) return;
      const victim = this.voiceHandles[victimIndex];
      if (victim === undefined) return;
      this.voiceHandles.splice(victimIndex, 1);
      victim.source.onended = null;
      try {
        victim.source.stop();
      } catch {
        // already stopped
      }
      victim.source.disconnect();
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(bus);
    const voice: ActiveVoiceHandle = { priority, source };
    if (exclusive) this.uiClickSources.add(source);
    source.onended = () => {
      const index = this.voiceHandles.indexOf(voice);
      if (index >= 0) this.voiceHandles.splice(index, 1);
      this.uiClickSources.delete(source);
      source.disconnect();
    };
    this.voiceHandles.push(voice);
    source.start();
  }

  private stopExclusiveUiClicks(): void {
    for (const source of this.uiClickSources) {
      const index = this.voiceHandles.findIndex((voice) => voice.source === source);
      if (index >= 0) this.voiceHandles.splice(index, 1);
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
    }
    this.uiClickSources.clear();
  }

  private resumeMusicVoices(): void {
    for (const voice of this.musicVoices) {
      void voice.element.play().catch(() => undefined);
    }
  }

  private spawnMusicVoice(file: string, targetGain: number): void {
    const context = this.context;
    const bus = this.musicGain;
    if (context === null || bus === null) return;

    const element = this.mediaElementFactory(file);
    element.loop = false;
    const sourceNode = context.createMediaElementSource(element);
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + CROSSFADE_SECONDS);
    sourceNode.connect(gain);
    gain.connect(bus);

    const voice: MusicVoice = { element, gain, sourceNode };
    element.addEventListener("ended", () => this.onTrackEnded(voice, false));
    element.addEventListener("error", () => this.onTrackEnded(voice, true));
    this.musicVoices.push(voice);
    void element.play().catch(() => undefined);
  }

  private onTrackEnded(voice: MusicVoice, failed: boolean): void {
    if (this.state === "disposed" || !this.playlistActive) return;
    const index = this.musicVoices.indexOf(voice);
    if (index < 0) return;
    this.musicVoices.splice(index, 1);
    this.retireMusicVoice(voice, failed ? 0 : CROSSFADE_SECONDS);
    if (failed) this.failedTracksInRun += 1;
    else this.failedTracksInRun = 0;
    if (failed && this.failedTracksInRun >= this.manifest.music.length) {
      this.playlistActive = false;
      return;
    }

    this.trackIndex = (this.trackIndex + 1) % this.manifest.music.length;
    const file = this.manifest.music[this.trackIndex];
    if (file === undefined) return;
    this.spawnMusicVoice(file.file, 1);
  }
  private retireMusicVoice(voice: MusicVoice, fadeSeconds: number): void {
    if (this.retiringMusicVoices.has(voice)) return;
    const context = this.context;
    if (context !== null) {
      const now = context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
    }
    this.retiringMusicVoices.add(voice);
    const timer = setTimeout(() => {
      this.crossfadeTimers.delete(timer);
      this.retiringMusicVoices.delete(voice);
      this.teardownMusicVoice(voice);
    }, fadeSeconds * 1000);
    this.crossfadeTimers.add(timer);
  }

  private teardownMusicVoice(voice: MusicVoice): void {
    voice.element.pause();
    voice.element.removeAttribute("src");
    voice.element.load();
    voice.sourceNode.disconnect();
    voice.gain.disconnect();
  }
}
