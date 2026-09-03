export const AUDIO_SETTINGS_KEY = "autobattleidle.audio-settings";
export const AUDIO_SETTINGS_VERSION = 1;

export type AudioPreferences = {
  readonly version: number;
  readonly master: number;
  readonly ui: number;
  readonly combat: number;
  readonly music: number;
  readonly muted: boolean;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  version: AUDIO_SETTINGS_VERSION,
  master: 1,
  ui: 1,
  combat: 1,
  music: 0.6,
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
