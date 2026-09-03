export const AUDIO_SETTINGS_KEY = "autobattleidle.audio-settings";
export const AUDIO_TRACK_INDEX_KEY = "autobattleidle.audio-track-index";
export const AUDIO_SETTINGS_VERSION = 1;

export type AudioPreferences = {
  readonly version: number;
  readonly master: number;
  readonly ui: number;
  readonly combat: number;
  readonly music: number;
  readonly muted: boolean;
};

// Persisted values are slider positions in 0..1. Every fresh slider starts at
// 100%; the mixer multiplies each position by invisible calibration constants
// so first-run audio is soft without lying in the UI.
export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  version: AUDIO_SETTINGS_VERSION,
  master: 1,
  ui: 1,
  combat: 1,
  music: 1,
  muted: false,
};

export type AudioPreferencesStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const parseGain = (value: unknown, fallback: number): number => {
  if (typeof value !== "number") return fallback;
  if (!Number.isFinite(value)) return fallback;
  if (value < 0 || value > 1) return fallback;
  return value;
};

const parsePreferences = (raw: unknown): AudioPreferences => {
  if (typeof raw !== "object" || raw === null) return DEFAULT_AUDIO_PREFERENCES;
  const record = raw as Record<string, unknown>;
  const version = record.version;
  if (version !== AUDIO_SETTINGS_VERSION) return DEFAULT_AUDIO_PREFERENCES;
  return {
    version: AUDIO_SETTINGS_VERSION,
    master: parseGain(record.master, DEFAULT_AUDIO_PREFERENCES.master),
    ui: parseGain(record.ui, DEFAULT_AUDIO_PREFERENCES.ui),
    combat: parseGain(record.combat, DEFAULT_AUDIO_PREFERENCES.combat),
    music: parseGain(record.music, DEFAULT_AUDIO_PREFERENCES.music),
    muted: typeof record.muted === "boolean" ? record.muted : DEFAULT_AUDIO_PREFERENCES.muted,
  };
};

export const loadAudioPreferences = (
  storage: AudioPreferencesStorage | null | undefined,
): AudioPreferences => {
  if (storage === null || storage === undefined) return DEFAULT_AUDIO_PREFERENCES;
  try {
    const raw = storage.getItem(AUDIO_SETTINGS_KEY);
    if (raw === null) return DEFAULT_AUDIO_PREFERENCES;
    return parsePreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_AUDIO_PREFERENCES;
  }
};

export const saveAudioPreferences = (
  storage: AudioPreferencesStorage | null | undefined,
  prefs: AudioPreferences,
): void => {
  if (storage === null || storage === undefined) return;
  storage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(prefs));
};

export const loadAudioTrackIndex = (
  storage: AudioPreferencesStorage | null | undefined,
): number | undefined => {
  if (storage === null || storage === undefined) return undefined;
  try {
    const raw = storage.getItem(AUDIO_TRACK_INDEX_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
};

export const saveAudioTrackIndex = (
  storage: AudioPreferencesStorage | null | undefined,
  trackIndex: number,
): void => {
  if (storage === null || storage === undefined) return;
  if (!Number.isSafeInteger(trackIndex) || trackIndex < 0) return;
  try {
    storage.setItem(AUDIO_TRACK_INDEX_KEY, JSON.stringify(trackIndex));
  } catch {
    /* live playback continues when the index cannot be persisted */
  }
};
