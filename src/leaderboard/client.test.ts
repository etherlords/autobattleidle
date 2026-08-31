import { describe, expect, it } from "vitest";
import { LeaderboardClient } from "./client";

const storage = (): Storage & { readonly values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: () => null,
    length: 0,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
    values,
  };
};

describe("LeaderboardClient", () => {
  it("keeps its bearer identity outside game persistence and sends scores only to the API", async () => {
    const calls: RequestInit[] = [];
    const client = new LeaderboardClient(
      storage(),
      async (_url, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ identity: { name: "Amber Lynx", token: "token" } }), {
          status: 200,
        });
      },
      "https://leaderboard.example",
    );
    await expect(client.submit(12)).resolves.toBeUndefined();
    expect(calls).toHaveLength(2);
    expect(calls[0]?.method).toBe("POST");
    expect(calls[1]?.body).toBe(JSON.stringify({ goldenBugs: 0, level: 12 }));
    expect((calls[1]?.headers as Record<string, string>).authorization).toBe("Bearer token");
  });

  it("reloads only its own identity key and preserves a game-save byte string", async () => {
    const saved = storage();
    const gameKey = "etherlords.autobattleidle.save.v3";
    const gameValue = '{"coins":9}';
    saved.setItem(gameKey, gameValue);
    const calls: RequestInit[] = [];
    const request = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push(init ?? {});
      return new Response(JSON.stringify({ identity: { name: "Amber Lynx", token: "token" } }));
    };
    await new LeaderboardClient(saved, request, "https://leaderboard.example").submit(1);
    await new LeaderboardClient(saved, request, "https://leaderboard.example").submit(2);
    expect(saved.getItem(gameKey)).toBe(gameValue);
    expect(saved.getItem("etherlords.autobattleidle.leaderboard.identity.v1")).toContain("token");
    expect(calls).toHaveLength(3);
    expect((calls[2]?.headers as Record<string, string>).authorization).toBe("Bearer token");
  });

  it("binds the default browser fetch while preserving injected request functions", async () => {
    const originalFetch = globalThis.fetch;
    const browserFetch = function (this: typeof globalThis, url: string): Promise<Response> {
      if (this !== globalThis) return Promise.reject(new TypeError("Illegal invocation"));
      if (url.endsWith("/v1/identity")) {
        return Promise.resolve(
          new Response(JSON.stringify({ identity: { name: "Amber Lynx", token: "token" } })),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ entries: [], me: null })));
    };
    Object.defineProperty(globalThis, "fetch", { configurable: true, value: browserFetch });
    try {
      await expect(
        new LeaderboardClient(storage(), undefined, "https://leaderboard.example").load(),
      ).resolves.toEqual({ entries: [], me: null });
    } finally {
      Object.defineProperty(globalThis, "fetch", { configurable: true, value: originalFetch });
    }
  });
});
