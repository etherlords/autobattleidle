import type { Env } from "./types";

const LIMIT = 20;
const WINDOW_MS = 60_000;

export const permit = async (env: Env, keys: readonly string[], now: number): Promise<boolean> => {
  await env.DB.prepare("DELETE FROM rate_limits WHERE reset_at <= ?").bind(now).run();

  for (const key of keys) {
    const statement = `INSERT INTO rate_limits(key_hash, count, reset_at)
VALUES (?, 1, ?)
ON CONFLICT(key_hash) DO UPDATE SET count = rate_limits.count + 1
WHERE rate_limits.reset_at > ? AND rate_limits.count < ?
RETURNING count`;
    const result = await env.DB.prepare(statement)
      .bind(key, now + WINDOW_MS, now, LIMIT)
      .all<{ count: number }>();
    if (result.results.length === 0) {
      return false;
    }
  }

  return true;
};
