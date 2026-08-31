import { lte, sql } from "drizzle-orm";
import { database } from "../db/client";
import { rateLimits } from "../db/schema";
import type { Env } from "../shared/types";

const LIMIT = 20;
const WINDOW_MS = 60_000;

export const permit = async (env: Env, keys: readonly string[], now: number): Promise<boolean> => {
  const db = database(env);
  await db.delete(rateLimits).where(lte(rateLimits.resetAt, now)).run();
  for (const key of keys) {
    const result = await db
      .insert(rateLimits)
      .values({ count: 1, keyHash: key, resetAt: now + WINDOW_MS })
      .onConflictDoUpdate({
        set: { count: sql`${rateLimits.count} + 1` },
        target: rateLimits.keyHash,
        where: sql`${rateLimits.resetAt} > ${now} and ${rateLimits.count} < ${LIMIT}`,
      })
      .returning({ count: rateLimits.count })
      .all();
    if (result.length === 0) return false;
  }
  return true;
};
