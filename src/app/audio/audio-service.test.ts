import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AUDIO_PREFERENCES, type AudioPreferences } from "./audio-preferences";
import { AudioService, type AudioServiceDeps } from "./audio-service";

type FakeParam = {
  value: number;
  setValueAtTime: (value: number) => void;
  linearRampToValueAtTime: (value: number) => void;
  cancelScheduledValues: () => void;
};

type FakeNode = {
  readonly connections: unknown[];
  connect: (destination: unknown) => unknown;
  disconnect: () => void;
};

type FakeGainNode = FakeNode & { readonly gain: FakeParam };

type FakeBufferSource = FakeNode & {
  buffer: unknown;
  onended: (() => void) | null;
  started: number;
  stopped: number;
  start: () => void;
  stop: () => void;
};

type FakeMediaElementNode = FakeNode & { readonly element: unknown };

const makeParam = (): FakeParam => {
  const param = {
    value: 1,
    setValueAtTime(value: number): void {
      param.value = value;
    },
    linearRampToValueAtTime(): void {},
    cancelScheduledValues(): void {},
  };
  return param;
};

const makeNode = (): FakeNode => {
  const node: {
    connections: unknown[];
    connect: (destination: unknown) => unknown;
    disconnect: () => void;
  } = {
    connections: [],
    connect: () => undefined,
    disconnect: () => undefined,
  };
  node.connect = (destination: unknown): unknown => {
    node.connections.push(destination);
    return destination;
  };
  return node;
};

const makeGain = (): FakeGainNode => {
  const node: FakeGainNode = {
    connections: [],
    connect: () => undefined,
    disconnect: () => undefined,
    gain: makeParam(),
  };
  node.connect = (destination: unknown): unknown => {
    node.connections.push(destination);
    return destination;
  };
  return node;
};

const makeBufferSource = (): FakeBufferSource => {
  const source: FakeBufferSource = {
    buffer: null,
    onended: null,
    started: 0,
    stopped: 0,
    connections: [],
    connect(destination: unknown): unknown {
      source.connections.push(destination);
      return destination;
    },
    disconnect(): void {},
    start(): void {
      source.started += 1;
    },
    stop(): void {
      source.stopped += 1;
    },
  };
  return source;
};

class FakeAudioContext {
  state: "suspended" | "running" = "suspended";
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => undefined);
  currentTime = 0;
  readonly destination: FakeNode = makeNode();
  readonly createdGains: FakeGainNode[] = [];
  readonly createdSources: FakeBufferSource[] = [];

  createGain(): unknown {
    const gain = makeGain();
    this.createdGains.push(gain);
    return gain;
  }

  createBufferSource(): unknown {
    const source = makeBufferSource();
    this.createdSources.push(source);
    return source;
  }

  createMediaElementSource(element: unknown): unknown {
    const node = makeNode() as unknown as FakeMediaElementNode & {
      element: unknown;
    };
    (node as { element: unknown }).element = element;
    return node;
  }

  decodeAudioData(): Promise<unknown> {
    return Promise.resolve({ duration: 0.2 });
  }
}

type FakeMediaElement = {
  src: string;
  loop: boolean;
  paused: boolean;
  play: () => Promise<void>;
  pause: () => void;
  load: () => void;
  removeAttribute: (name: string) => void;
  addEventListener: (type: string, handler: () => void) => void;
  dispatch: (type: string) => void;
};

const makeMediaElement = (): FakeMediaElement => {
  const listeners = new Map<string, Array<() => void>>();
  const element = {
    src: "",
    loop: false,
    paused: true,
    play: async (): Promise<void> => {
      element.paused = false;
    },
    pause: (): void => {
      element.paused = true;
    },
    load: (): void => {},
    removeAttribute: (): void => {},
    addEventListener: (type: string, handler: () => void): void => {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    dispatch: (type: string): void => {
      for (const handler of listeners.get(type) ?? []) handler();
    },
  };
  return element;
};

const makeDeps = (overrides: Partial<AudioServiceDeps> = {}): AudioServiceDeps => {
  const music = [
    { file: "audio/music/pastoral-loop.mp3" },
    { file: "audio/music/idle-fantasy.mp3" },
    { file: "audio/music/idle-dawn.mp3" },
  ];
  return {
    manifest: { music },
    ...overrides,
  };
};

const unlockedService = async (
  overrides: Partial<AudioServiceDeps> = {},
): Promise<{ service: AudioService; context: FakeAudioContext }> => {
  const context = new FakeAudioContext();
  const service = new AudioService({
    ...makeDeps(overrides),
    context: context as unknown as AudioContext,
  });
  await service.unlock();
  return { service, context };
};

const combatPrefs = (overrides: Partial<AudioPreferences> = {}): AudioPreferences => ({
  ...DEFAULT_AUDIO_PREFERENCES,
  ...overrides,
});

const elementFactory =
  (elements: FakeMediaElement[]): ((src: string) => HTMLAudioElement) =>
  (src: string) => {
    const element = makeMediaElement();
    element.src = src;
    elements.push(element);
    return element as unknown as HTMLAudioElement;
  };

const stubFetch = (): void => {
  globalThis.fetch = (async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })) as unknown as typeof fetch;
};

type DocumentStub = {
  readonly removeCalls: string[];
  setVisibility: (state: "visible" | "hidden") => void;
  dispatch: (type: string) => void;
};

const stubDocument = (): DocumentStub => {
  const removeCalls: string[] = [];
  const listeners = new Map<string, Array<() => void>>();
  const documentLike = {
    visibilityState: "visible",
    addEventListener: (type: string, handler: () => void): void => {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    removeEventListener: (type: string): void => {
      removeCalls.push(type);
      listeners.delete(type);
    },
    dispatchEvent: (event: { type: string }): boolean => {
      for (const handler of listeners.get(event.type) ?? []) handler();
      return true;
    },
  };
  globalThis.document = documentLike as unknown as Document;
  return {
    removeCalls,
    setVisibility: (state: "visible" | "hidden"): void => {
      (documentLike as { visibilityState: string }).visibilityState = state;
    },
    dispatch: (type: string): void => {
      documentLike.dispatchEvent({ type });
    },
  };
};

describe("audio service", () => {
  it("starts blocked and becomes ready after unlock", async () => {
    stubFetch();
    const context = new FakeAudioContext();
    const service = new AudioService({
      ...makeDeps(),
      context: context as unknown as AudioContext,
    });
    expect(service.currentState).toBe("blocked");
    const ok = await service.unlock();
    expect(ok).toBe(true);
    expect(context.resume).toHaveBeenCalledOnce();
    expect(service.currentState).toBe("ready");
  });
  it("notifies settings subscribers when the audio state changes", async () => {
    stubFetch();
    const context = new FakeAudioContext();
    const service = new AudioService({
      ...makeDeps(),
      context: context as unknown as AudioContext,
    });
    const states: string[] = [];
    const unsubscribe = service.subscribeState((state) => states.push(state));

    await service.unlock();

    expect(states).toEqual(["ready"]);
    unsubscribe();
    service.dispose();
    expect(states).toEqual(["ready"]);
  });

  it("reports error state non-fatally when resume rejects, then recovers", async () => {
    stubFetch();
    const context = new FakeAudioContext();
    context.resume.mockRejectedValueOnce(new Error("autoplay blocked"));
    const service = new AudioService({
      ...makeDeps(),
      context: context as unknown as AudioContext,
    });
    expect(await service.unlock()).toBe(false);
    expect(service.currentState).toBe("error");
    context.resume.mockResolvedValueOnce(undefined);
    expect(await service.unlock()).toBe(true);
    expect(service.currentState).toBe("ready");
  });

  it("applies gain math master * category and zeroes on mute without overwriting category values", async () => {
    stubFetch();
    const { service, context } = await unlockedService();
    service.setPreferences(combatPrefs({ master: 0.5, ui: 0.8, combat: 0.4, music: 0.25 }));
    const [master, uiBus, combatBus] = context.createdGains;
    if (master === undefined || uiBus === undefined || combatBus === undefined)
      throw new Error("Expected mixer buses");
    expect(master.gain.value).toBeCloseTo(0.5);
    expect(uiBus.gain.value).toBeCloseTo(0.8);
    expect(combatBus.gain.value).toBeCloseTo(0.4);

    service.setMuted(true);
    expect(master.gain.value).toBe(0);
    expect(uiBus.gain.value).toBeCloseTo(0.8);
    expect(combatBus.gain.value).toBeCloseTo(0.4);

    service.setMuted(false);
    expect(master.gain.value).toBeCloseTo(0.5);
  });

  it("caps concurrent voices at 6 and drops the lowest priority pending voice", async () => {
    stubFetch();
    const { service, context } = await unlockedService();
    for (let index = 0; index < 6; index += 1) {
      service.playCue({ type: "attack", kind: "hit", source: "automatic" }, index);
    }
    await vi.waitFor(() => expect(service.activeVoices).toHaveLength(6));

    service.playCue({ type: "attack", kind: "hit", source: "manual" }, 0);
    await vi.waitFor(() => {
      const priorities = service.activeVoices.map((voice) => voice.priority);
      expect(priorities.filter((priority) => priority === 1)).toHaveLength(1);
      expect(priorities.filter((priority) => priority === 0)).toHaveLength(5);
    });
    expect(context.createdSources).toHaveLength(7);

    const stopped = context.createdSources.filter((source) => source.stopped > 0);
    expect(stopped).toHaveLength(1);
    expect(stopped[0]?.started ?? 0).toBe(1);
  });

  it("never drops death, boss, or golden-kill voices", async () => {
    stubFetch();
    const { service, context } = await unlockedService();
    for (let index = 0; index < 6; index += 1) {
      service.playCue({ type: "attack", kind: "hit", source: "automatic" }, index);
    }
    await vi.waitFor(() => expect(service.activeVoices).toHaveLength(6));

    service.playCue({ type: "scene", name: "death" });
    await vi.waitFor(() =>
      expect(service.activeVoices.some((voice) => voice.priority === 3)).toBe(true),
    );
    expect(service.activeVoices).toHaveLength(6);

    const topSource = context.createdSources.at(-1);
    if (topSource === undefined) throw new Error("Expected the death cue source");
    expect(topSource.started).toBe(1);
    expect(topSource.stopped).toBe(0);
  });

  it("coalesces automatic hits to one voice per batch frame", async () => {
    stubFetch();
    const { service, context } = await unlockedService();
    service.playBattleCues([
      { kind: "hit", packets: { count: 1, units: 1 }, source: "automatic" },
      { kind: "hit", packets: { count: 3, units: 3 }, source: "automatic" },
      { kind: "hit", packets: { count: 2, units: 2 }, source: "automatic" },
    ]);
    await vi.waitFor(() => expect(service.activeVoices.length).toBeGreaterThan(0));
    expect(context.createdSources).toHaveLength(1);
  });

  it("drives a deterministic non-repeating playlist and advances on ended", async () => {
    stubFetch();
    const elements: FakeMediaElement[] = [];
    const { service } = await unlockedService({
      mediaElementFactory: elementFactory(elements),
    });
    service.startMusic();
    expect(service.musicVoiceCount).toBe(1);
    expect(service.currentTrackIndex).toBe(0);

    elements[0]?.dispatch("ended");
    expect(service.currentTrackIndex).toBe(1);
    expect(elements).toHaveLength(2);
    expect(elements[0]?.paused).toBe(false);

    elements[1]?.dispatch("ended");
    elements[2]?.dispatch("ended");
    expect(service.currentTrackIndex).toBe(0);
    expect(elements).toHaveLength(4);
  });

  it("crossfades: retiring voice is disposed exactly once", async () => {
    stubFetch();
    vi.useFakeTimers();
    try {
      const elements: FakeMediaElement[] = [];
      const { service } = await unlockedService({
        mediaElementFactory: elementFactory(elements),
      });
      service.startMusic();
      elements[0]?.dispatch("ended");
      expect(service.currentTrackIndex).toBe(1);
      vi.advanceTimersByTime(1600);
      expect(elements[0]?.paused).toBe(true);
      expect(service.musicVoiceCount).toBe(1);
      vi.advanceTimersByTime(1600);
      expect(elements[0]?.paused).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skips a failing track without a retry storm", async () => {
    stubFetch();
    const elements: FakeMediaElement[] = [];
    const { service } = await unlockedService({
      mediaElementFactory: elementFactory(elements),
    });
    service.startMusic();
    elements[0]?.dispatch("error");
    expect(service.currentTrackIndex).toBe(1);
    expect(elements).toHaveLength(2);
  });
  it("stops a playlist run after every track fails once", async () => {
    const elements: FakeMediaElement[] = [];
    const { service } = await unlockedService({
      mediaElementFactory: elementFactory(elements),
    });
    service.startMusic();

    elements[0]?.dispatch("error");
    elements[1]?.dispatch("error");
    elements[2]?.dispatch("error");

    expect(elements).toHaveLength(3);
    expect(service.musicVoiceCount).toBe(0);
  });

  it("suspends on visibilitychange hidden and waits for a gesture to resume", async () => {
    stubFetch();
    const documentStub = stubDocument();
    const context = new FakeAudioContext();
    const service = new AudioService({
      ...makeDeps(),
      context: context as unknown as AudioContext,
    });
    await service.unlock();
    expect(service.currentState).toBe("ready");

    documentStub.setVisibility("hidden");
    documentStub.dispatch("visibilitychange");
    expect(service.currentState).toBe("suspended");
    expect(context.suspend).toHaveBeenCalledOnce();

    documentStub.setVisibility("visible");
    documentStub.dispatch("visibilitychange");
    expect(service.currentState).toBe("suspended");
    expect(context.resume).toHaveBeenCalledOnce();

    await service.unlock();
    expect(service.currentState).toBe("ready");
  });

  it("dispose is idempotent and releases resources exactly once", async () => {
    stubFetch();
    const documentStub = stubDocument();
    const context = new FakeAudioContext();
    const elements: FakeMediaElement[] = [];
    const service = new AudioService({
      ...makeDeps(),
      context: context as unknown as AudioContext,
      mediaElementFactory: elementFactory(elements),
    });
    await service.unlock();
    service.startMusic();
    service.playCue({ type: "scene", name: "death" });
    await vi.waitFor(() => expect(service.activeVoices).toHaveLength(1));

    service.dispose();
    expect(service.currentState).toBe("disposed");
    expect(context.close).not.toHaveBeenCalled();
    expect(documentStub.removeCalls).toContain("visibilitychange");
    expect(elements[0]?.paused).toBe(true);

    service.dispose();
    expect(context.close).not.toHaveBeenCalled();
  });
});
