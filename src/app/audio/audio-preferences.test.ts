import { describe, expect, it, vi } from "vitest";
import {
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  saveAudioPreferences,
  type AudioPreferences,
  type AudioPreferencesStorage,
} from "./audio-preferences";

const makeStorage = (
  initial: string | null = null,
): AudioPreferencesStorage & {
  readonly throwOnGet: { value: boolean };
} => {
  const state = { throwOnGet: { value: false } };
  const backing = new Map<string, string>();
  if (initial !== null) backing.set(AUDIO_SETTINGS_KEY, initial);
  return {
    throwOnGet: state.throwOnGet,
    getItem: (key: string) => {
      if (state.throwOnGet.value) throw new Error("storage unavailable");
      return backing.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      backing.set(key, value);
    },
  };
};

const stored = (value: unknown): string => JSON.stringify(value);

describe("audio preferences", () => {
  it("exposes defaults with the frozen key and version", () => {
    expect(AUDIO_SETTINGS_KEY).toBe("autobattleidle.audio-settings");
    expect(DEFAULT_AUDIO_PREFERENCES).toEqual({
      version: 1,
      master: 1,
      ui: 1,
      combat: 1,
      music: 0.6,
      muted: false,
    });
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadAudioPreferences(makeStorage())).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(loadAudioPreferences(makeStorage(null))).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("round-trips valid preferences", () => {
    const prefs: AudioPreferences = {
      version: 1,
      master: 0.5,
      ui: 0.25,
      combat: 0.75,
      music: 0.1,
      muted: true,
    };
    const storage = makeStorage();
    saveAudioPreferences(storage, prefs);
    expect(loadAudioPreferences(storage)).toEqual(prefs);
  });

  it("rejects NaN, Infinity, and out-of-range gains per field", () => {
    const raw = stored({
      version: 1,
      master: Number.NaN,
      ui: Number.POSITIVE_INFINITY,
      combat: 1.5,
      music: -0.1,
      muted: true,
    });
    expect(loadAudioPreferences(makeStorage(raw))).toEqual({
      version: 1,
      master: DEFAULT_AUDIO_PREFERENCES.master,
      ui: DEFAULT_AUDIO_PREFERENCES.ui,
      combat: DEFAULT_AUDIO_PREFERENCES.combat,
      music: DEFAULT_AUDIO_PREFERENCES.music,
      muted: true,
    });
  });

  it("keeps valid fields while replacing only the malformed one", () => {
    const raw = stored({
      version: 1,
      master: 0.3,
      ui: "loud",
      combat: 0.9,
      music: 0.2,
      muted: false,
    });
    const prefs = loadAudioPreferences(makeStorage(raw));
    expect(prefs.master).toBe(0.3);
    expect(prefs.ui).toBe(DEFAULT_AUDIO_PREFERENCES.ui);
    expect(prefs.combat).toBe(0.9);
    expect(prefs.music).toBe(0.2);
  });

  it("falls back to defaults for malformed JSON and wrong shapes", () => {
    expect(loadAudioPreferences(makeStorage("{not json"))).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(loadAudioPreferences(makeStorage(stored([1, 2])))).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(loadAudioPreferences(makeStorage(stored({ version: 2, master: 0.5 })))).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
    expect(loadAudioPreferences(makeStorage(stored("a string")))).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
    expect(loadAudioPreferences(makeStorage(stored(null)))).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("defaults muted when it is not a boolean", () => {
    const raw = stored({ version: 1, master: 0.4, muted: "yes" });
    expect(loadAudioPreferences(makeStorage(raw)).muted).toBe(false);
  });

  it("treats storage failures as non-fatal and returns defaults", () => {
    const storage = makeStorage();
    storage.throwOnGet.value = true;
    expect(loadAudioPreferences(storage)).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("save propagates storage failures to the caller", () => {
    const storage = makeStorage();
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => saveAudioPreferences(storage, DEFAULT_AUDIO_PREFERENCES)).toThrowError(
      "quota exceeded",
    );
  });

  it("save/load independence: reset() semantics via fresh defaults object", () => {
    const storage = makeStorage();
    saveAudioPreferences(storage, {
      version: 1,
      master: 0.2,
      ui: 0.2,
      combat: 0.2,
      music: 0.2,
      muted: true,
    });
    const restored = loadAudioPreferences(storage);
    expect(restored).not.toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(loadAudioPreferences(makeStorage())).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });
});
