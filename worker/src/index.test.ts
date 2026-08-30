import { describe, expect, it } from "vitest";
import { handler, type Env } from "./index";

class MemoryD1 {
  readonly values: unknown[] = [];
  readonly players: {
    id: number;
    token: string;
    name: string;
    level: number;
    achieved: number;
    renamed: number | null;
  }[] = [];
  readonly rates = new Map<string, { count: number; reset: number }>();
  atCapacity = false;
  private createNameCollisions = 0;
  private renameNameCollisions = 0;
  private nextId = 1;
  rejectNameCollisions(kind: "create" | "rename", count: number): void {
    if (kind === "create") this.createNameCollisions = count;
    else this.renameNameCollisions = count;
  }
  prepare(query: string): D1PreparedStatement {
    return this.statement(query);
  }
  private statement(query: string): D1PreparedStatement {
    return {
      bind: (...values) => this.bound(query, values),
      all: async <T>() => ({ results: [] as readonly T[] }),
      first: async <T>() => Promise.resolve<T | null>(null),
      run: async () => ({ meta: { changes: 0 } }),
    };
  }
  private bound(query: string, values: readonly unknown[]): D1PreparedStatement {
    this.values.push(...values);
    const rows = (): readonly unknown[] => {
      const ranked = [...this.players].sort(
        (a, b) => b.level - a.level || a.achieved - b.achieved || a.id - b.id,
      );
      if (query.startsWith("INSERT INTO rate_limits")) {
        const key = String(values[0]);
        const existing = this.rates.get(key);
        if (existing !== undefined && existing.count >= 20) return [];
        const next =
          existing === undefined
            ? { count: 1, reset: Number(values[1]) }
            : { ...existing, count: existing.count + 1 };
        this.rates.set(key, next);
        return [{ count: next.count }];
      }
      if (query.includes("FROM rate_limits"))
        return [...this.rates.entries()]
          .filter(([key]) => values.includes(key))
          .map(([key, value]) => ({ key_hash: key, count: value.count, reset_at: value.reset }));
      if (query.includes("ORDER BY best_level DESC") && !query.includes("WHERE"))
        return ranked
          .slice(0, Number(values[0]))
          .map((p) => ({ display_name: p.name, best_level: p.level }));
      if (query.includes("ORDER BY best_level ASC"))
        return ranked
          .filter(
            (p) =>
              p.level > Number(values[0]) ||
              (p.level === Number(values[0]) &&
                (p.achieved < Number(values[2]) ||
                  (p.achieved === Number(values[2]) && p.id < Number(values[4])))),
          )
          .slice(-Number(values[5]));
      if (query.includes("ORDER BY best_level DESC") && query.includes("WHERE"))
        return ranked
          .filter(
            (p) =>
              p.level < Number(values[0]) ||
              (p.level === Number(values[0]) &&
                (p.achieved > Number(values[2]) ||
                  (p.achieved === Number(values[2]) && p.id > Number(values[4])))),
          )
          .slice(0, Number(values[5]));
      return [];
    };
    const first = (): unknown => {
      if (query.includes("COUNT(*)")) {
        const player = values;
        return {
          count: this.players.filter(
            (p) =>
              p.level > Number(player[0]) ||
              (p.level === Number(player[1]) &&
                (p.achieved < Number(player[2]) ||
                  (p.achieved === Number(player[3]) && p.id < Number(player[4])))),
          ).length,
        };
      }
      const player = this.players.find((p) => p.token === values[0]);
      if (query.includes("renamed_at"))
        return player === undefined ? null : { renamed_at: player.renamed };
      return player === undefined
        ? null
        : {
            achieved_at: player.achieved,
            best_level: player.level,
            display_name: player.name,
            id: player.id,
          };
    };
    return {
      bind: (...next) => this.bound(query, next),
      all: async <T>() => ({ results: rows() as readonly T[] }),
      first: async <T>() => first() as T | null,
      run: async () => {
        return { meta: { changes: this.run(query, values) } };
      },
    };
  }
  // eslint-disable-next-line complexity -- exact in-memory model of the bounded Worker SQL.
  private run(query: string, values: readonly unknown[]): number {
    if (query.startsWith("DELETE FROM rate_limits WHERE reset_at")) {
      for (const [key, value] of this.rates)
        if (value.reset <= Number(values[0])) this.rates.delete(key);
      return 0;
    }
    if (query.startsWith("DELETE FROM rate_limits WHERE key_hash")) {
      this.rates.delete(String(values[0]));
      return 0;
    }
    if (query.startsWith("INSERT INTO players")) {
      if (this.atCapacity) return 0;
      if (this.createNameCollisions > 0) {
        this.createNameCollisions -= 1;
        throw new Error("UNIQUE constraint failed: players.display_name");
      }
      this.players.push({
        achieved: Number(values[2]),
        id: this.nextId++,
        level: 0,
        name: String(values[1]),
        renamed: null,
        token: String(values[0]),
      });
      return 1;
    }
    if (query.startsWith("DELETE FROM players")) {
      const index = this.players.findIndex((p) => p.token === values[0]);
      if (index >= 0) this.players.splice(index, 1);
      return 1;
    }
    if (query.startsWith("UPDATE players SET best_level")) {
      const player = this.players.find((p) => p.token === values[4]);
      if (player !== undefined && Number(values[0]) > player.level) {
        player.level = Number(values[0]);
        player.achieved = Number(values[2]);
      }
      return 1;
    }
    if (query.startsWith("UPDATE players SET display_name")) {
      if (this.renameNameCollisions > 0) {
        this.renameNameCollisions -= 1;
        throw new Error("UNIQUE constraint failed: players.display_name");
      }
      const player = this.players.find((p) => p.token === values[3]);
      if (player !== undefined && player.renamed !== null && player.renamed > Number(values[4]))
        return 0;
      if (player !== undefined) {
        player.name = String(values[0]);
        player.renamed = Number(values[1]);
      }
      return 1;
    }
    return 0;
  }
}

const env = (db = new MemoryD1()): Env => ({
  ALLOWED_ORIGINS: "https://game.example",
  DB: db,
  IP_HASH_KEY: "test-key",
});
const request = (path: string, options: RequestInit = {}): Request => {
  const headers = new Headers(options.headers);
  headers.set("Origin", "https://game.example");
  return new Request(`https://worker.example${path}`, { ...options, headers });
};
const identity = async (db: MemoryD1): Promise<string> => {
  const response = await handler.fetch(request("/v1/identity", { method: "POST" }), env(db));
  return ((await response.json()) as { identity: { token: string } }).identity.token;
};
const auth = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "content-type": "application/json",
});

describe("leaderboard worker boundary", () => {
  it("rejects origin and creates only a hashed anonymous identity", async () => {
    const db = new MemoryD1();
    expect(
      (await handler.fetch(new Request("https://worker.example/v1/top"), env(db))).status,
    ).toBe(403);
    const response = await handler.fetch(
      request("/v1/identity", {
        headers: { "CF-Connecting-IP": "198.51.100.9" },
        method: "POST",
      }),
      env(db),
    );
    const identity = (await response.json()) as { identity: { token: string } };
    expect(response.status).toBe(201);
    expect(db.values).not.toContain(identity.identity.token);
    expect(db.values).not.toContain("198.51.100.9");
  });

  it("allows CORS preflight only from configured origins", async () => {
    const db = new MemoryD1();
    const allowed = await handler.fetch(request("/v1/top", { method: "OPTIONS" }), env(db));
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://game.example");
    const denied = await handler.fetch(
      new Request("https://worker.example/v1/top", {
        headers: { Origin: "https://untrusted.example" },
        method: "OPTIONS",
      }),
      env(db),
    );
    expect(denied.status).toBe(403);
    expect(denied.headers.get("access-control-allow-origin")).toBe("");
  });

  it("requires auth, rejects invalid JSON score bodies, and returns empty 204 writes", async () => {
    const db = new MemoryD1();
    expect((await handler.fetch(request("/v1/score", { method: "POST" }), env(db))).status).toBe(
      401,
    );
    const token = await identity(db);
    const auth = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
    expect(
      (
        await handler.fetch(
          request("/v1/score", { body: "{", headers: auth, method: "POST" }),
          env(db),
        )
      ).status,
    ).toBe(400);
    const response = await handler.fetch(
      request("/v1/score", { body: JSON.stringify({ level: 2 }), headers: auth, method: "POST" }),
      env(db),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(db.values).not.toContain(token);
  });

  it("keeps generated identities, rename policy, monotonic scores, ranks, and deletion server-owned", async () => {
    const db = new MemoryD1();
    const first = await identity(db);
    const second = await identity(db);
    expect(db.players.map((player) => player.name)).toEqual(
      expect.arrayContaining([expect.stringContaining("Amber Lynx")]),
    );
    expect(db.players[0]?.name).not.toBe(db.players[1]?.name);
    expect(
      (
        await handler.fetch(
          request("/v1/name", {
            body: JSON.stringify({ name: "  Jane   Doe  " }),
            headers: auth(first),
            method: "POST",
          }),
          env(db),
        )
      ).status,
    ).toBe(200);
    expect(db.players[0]?.name).toContain("Jane Doe");
    expect(
      (
        await handler.fetch(
          request("/v1/name", {
            body: JSON.stringify({ name: "admin" }),
            headers: auth(second),
            method: "POST",
          }),
          env(db),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handler.fetch(
          request("/v1/name", {
            body: JSON.stringify({ name: "other" }),
            headers: auth(first),
            method: "POST",
          }),
          env(db),
        )
      ).status,
    ).toBe(429);
    for (const [token, level] of [
      [first, 10],
      [second, 10],
      [first, 3],
    ] as const)
      expect(
        (
          await handler.fetch(
            request("/v1/score", {
              body: JSON.stringify({ level }),
              headers: auth(token),
              method: "POST",
            }),
            env(db),
          )
        ).status,
      ).toBe(204);
    expect(db.players[0]?.level).toBe(10);
    const top = await handler.fetch(
      request("/v1/top", { headers: { Authorization: `Bearer ${first}` } }),
      env(db),
    );
    expect(
      ((await top.json()) as { entries: { level: number }[] }).entries.map((entry) => entry.level),
    ).toEqual([10, 10]);
    const around = await handler.fetch(
      request("/v1/around", { headers: { Authorization: `Bearer ${first}` } }),
      env(db),
    );
    expect(((await around.json()) as { entries: unknown[] }).entries).toHaveLength(2);
    const deleted = await handler.fetch(
      request("/v1/identity", { headers: { Authorization: `Bearer ${first}` }, method: "DELETE" }),
      env(db),
    );
    expect(deleted.status).toBe(204);
    expect(db.players).toHaveLength(1);
  });

  it("limits anonymous creation and authenticated writes by their hashed keys", async () => {
    const creations = new MemoryD1();
    for (let index = 0; index < 20; index += 1)
      expect(
        (await handler.fetch(request("/v1/identity", { method: "POST" }), env(creations))).status,
      ).toBe(201);
    expect(
      (await handler.fetch(request("/v1/identity", { method: "POST" }), env(creations))).status,
    ).toBe(429);

    const writes = new MemoryD1();
    const token = await identity(writes);
    const headers = new Headers(auth(token));
    headers.set("CF-Connecting-IP", "198.51.100.9");
    for (let index = 0; index < 20; index += 1)
      expect(
        (
          await handler.fetch(
            request("/v1/score", {
              body: JSON.stringify({ level: index }),
              headers,
              method: "POST",
            }),
            env(writes),
          )
        ).status,
      ).toBe(204);
    expect(
      (
        await handler.fetch(
          request("/v1/score", { body: JSON.stringify({ level: 21 }), headers, method: "POST" }),
          env(writes),
        )
      ).status,
    ).toBe(429);
  });

  it("allows only one concurrent rename during the server cooldown", async () => {
    const db = new MemoryD1();
    const token = await identity(db);
    const responses = await Promise.all(
      ["First Name", "Second Name"].map((name) =>
        handler.fetch(
          request("/v1/name", {
            body: JSON.stringify({ name }),
            headers: auth(token),
            method: "POST",
          }),
          env(db),
        ),
      ),
    );
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(1);
  });

  it("atomically bounds interleaved writes and leaderboard reads", async () => {
    const db = new MemoryD1();
    const token = await identity(db);
    const headers = auth(token);
    const writes = await Promise.all(
      Array.from({ length: 21 }, (_, level) =>
        handler.fetch(
          request("/v1/score", {
            body: JSON.stringify({ level }),
            headers,
            method: "POST",
          }),
          env(db),
        ),
      ),
    );
    expect(writes.filter((response) => response.status === 204)).toHaveLength(20);
    expect(writes.filter((response) => response.status === 429)).toHaveLength(1);
    for (let index = 0; index < 20; index += 1)
      expect((await handler.fetch(request("/v1/top", { headers }), env(db))).status).toBe(200);
    expect((await handler.fetch(request("/v1/top", { headers }), env(db))).status).toBe(429);
  });

  it("retries display-name collisions, enforces capacity, and clears identity rate keys on reset", async () => {
    const collisions = new MemoryD1();
    collisions.rejectNameCollisions("create", 1);
    const token = await identity(collisions);
    expect(collisions.players).toHaveLength(1);
    const originalName = collisions.players[0]?.name;
    collisions.rejectNameCollisions("rename", 1);
    const renamed = await handler.fetch(
      request("/v1/name", {
        body: JSON.stringify({ name: "Jane Doe" }),
        headers: auth(token),
        method: "POST",
      }),
      env(collisions),
    );
    expect(renamed.status).toBe(200);
    expect(collisions.players[0]?.name).not.toBe(originalName);
    const storedHash = collisions.players[0]?.token;
    if (storedHash === undefined) throw new Error("Expected stored token hash");
    await handler.fetch(
      request("/v1/score", {
        body: JSON.stringify({ level: 1 }),
        headers: auth(token),
        method: "POST",
      }),
      env(collisions),
    );
    await handler.fetch(
      request("/v1/identity", { headers: auth(token), method: "DELETE" }),
      env(collisions),
    );
    expect([...collisions.rates.keys()].some((key) => key.includes(storedHash))).toBe(false);

    const capacity = new MemoryD1();
    capacity.atCapacity = true;
    expect(
      (await handler.fetch(request("/v1/identity", { method: "POST" }), env(capacity))).status,
    ).toBe(503);
  });

  it("caps Top 100 and Around Me at 100 entries on each side", async () => {
    const db = new MemoryD1();
    const token = await identity(db);
    const mine = db.players[0];
    if (mine === undefined) throw new Error("Expected identity");
    mine.level = 150;
    for (let index = 1; index <= 150; index += 1)
      db.players.push({
        achieved: index,
        id: index + 1,
        level: 400 - index,
        name: `Above ${index}`,
        renamed: null,
        token: `above-${index}`,
      });
    for (let index = 1; index <= 150; index += 1)
      db.players.push({
        achieved: index + 200,
        id: index + 200,
        level: 149 - index,
        name: `Below ${index}`,
        renamed: null,
        token: `below-${index}`,
      });
    const headers = { Authorization: `Bearer ${token}` };
    const top = (await (await handler.fetch(request("/v1/top", { headers }), env(db))).json()) as {
      entries: { level: number }[];
    };
    expect(top.entries).toHaveLength(100);
    expect(top.entries[0]?.level).toBe(399);
    expect(top.entries[99]?.level).toBe(300);
    const around = (await (
      await handler.fetch(request("/v1/around", { headers }), env(db))
    ).json()) as { entries: { level: number }[]; me: { rank: number } };
    expect(around.me.rank).toBe(151);
    expect(around.entries).toHaveLength(201);
    expect(around.entries[100]?.level).toBe(150);
  });
});
