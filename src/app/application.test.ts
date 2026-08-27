import { describe, expect, it } from "vitest";

import { startApplication } from "./application";

describe("startApplication", () => {
  it("owns one frame and resize listener, then disposes both idempotently", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    const resizeListeners = new Set<EventListenerOrEventListenerObject>();
    const calls = {
      cancel: 0,
      gameDispose: 0,
      hudDispose: 0,
      persistenceDispose: 0,
      render: 0,
      resize: 0,
    };
    let nextFrame = 1;
    const app = startApplication({
      window: {
        addEventListener: (type, listener) => {
          if (type === "resize") resizeListeners.add(listener);
        },
        cancelAnimationFrame: (id) => {
          calls.cancel += 1;
          callbacks.delete(id);
        },
        removeEventListener: (type, listener) => {
          if (type === "resize") resizeListeners.delete(listener);
        },
        requestAnimationFrame: (callback) => {
          const id = nextFrame;
          nextFrame += 1;
          callbacks.set(id, callback);
          return id;
        },
      },
      game: {
        dispose: () => {
          calls.gameDispose += 1;
        },
        render: () => {
          calls.render += 1;
        },
        resize: () => {
          calls.resize += 1;
        },
      },
      hud: {
        dispose: () => {
          calls.hudDispose += 1;
        },
        render: () => undefined,
      },
      persistence: {
        dispose: () => {
          calls.persistenceDispose += 1;
        },
        onStateChanged: () => undefined,
      },
      snapshot: {
        encounter: "Test",
        enemy: { health: 1, name: "Enemy" },
        player: { health: 1, name: "Player" },
      },
      viewport: () => ({ height: 240, width: 400 }),
      onDispose: () => undefined,
    });
    expect(resizeListeners.size).toBe(1);
    expect(calls.resize).toBe(1);
    expect(callbacks.size).toBe(1);
    app.dispose();
    app.dispose();
    expect(resizeListeners.size).toBe(0);
    expect(callbacks.size).toBe(0);
    expect(calls).toMatchObject({
      cancel: 1,
      gameDispose: 1,
      hudDispose: 1,
      persistenceDispose: 1,
      render: 0,
      resize: 1,
    });
  });
});
