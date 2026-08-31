import { and, eq, lte, or, sql } from "drizzle-orm";
import { database } from "../db/client";
import { players, rateLimits } from "../db/schema";
import type { Env, Player } from "../shared/types";

const BOARD_CAPACITY = 10_000;
export type IdentityCreation = "capacity" | "collision" | "created";
export type RenameResult = "collision" | "cooldown" | "renamed";

const uniqueConflict = (error: unknown): boolean =>
  error instanceof Error &&
  (error.message.includes("UNIQUE constraint") ||
    (error.cause instanceof Error && error.cause.message.includes("UNIQUE constraint")));

const playerFields = {
  achieved_at: players.achievedAt,
  best_golden_bugs: players.bestGoldenBugs,
  best_level: players.bestLevel,
  display_name: players.displayName,
  golden_bugs_achieved_at: players.goldenBugsAchievedAt,
  id: players.id,
};

export const createPlayer = async (
  env: Env,
  tokenHash: string,
  name: string,
  now: number,
): Promise<IdentityCreation> => {
  try {
    const result = await database(env).run(sql`
      INSERT INTO ${players} (${players.tokenHash}, ${players.displayName}, ${players.achievedAt}, ${players.createdAt}, ${players.updatedAt})
      SELECT ${tokenHash}, ${name}, ${now}, ${now}, ${now}
      WHERE (SELECT count(*) FROM ${players}) < ${BOARD_CAPACITY}
    `);
    return result.meta.changes === 1 ? "created" : "capacity";
  } catch (error: unknown) {
    if (uniqueConflict(error)) return "collision";
    throw error;
  }
};

export const playerFor = (env: Env, tokenHash: string): Promise<Player | undefined> =>
  database(env).select(playerFields).from(players).where(eq(players.tokenHash, tokenHash)).get();

export const submitScore = (
  env: Env,
  tokenHash: string,
  level: number,
  goldenBugs: number,
  now: number,
): Promise<unknown> =>
  database(env)
    .update(players)
    .set({
      achievedAt: sql`case when ${level} > ${players.bestLevel} then ${now} else ${players.achievedAt} end`,
      bestGoldenBugs: sql`max(${players.bestGoldenBugs}, ${goldenBugs})`,
      bestLevel: sql`max(${players.bestLevel}, ${level})`,
      goldenBugsAchievedAt: sql`case when ${goldenBugs} > ${players.bestGoldenBugs} then ${now} else ${players.goldenBugsAchievedAt} end`,
      updatedAt: now,
    })
    .where(eq(players.tokenHash, tokenHash))
    .run();

export const renamePlayer = async (
  env: Env,
  tokenHash: string,
  name: string,
  now: number,
): Promise<RenameResult> => {
  try {
    const result = await database(env)
      .update(players)
      .set({ displayName: name, renamedAt: now, updatedAt: now })
      .where(
        and(
          eq(players.tokenHash, tokenHash),
          or(sql`${players.renamedAt} is null`, lte(players.renamedAt, now - 86_400_000)),
        ),
      )
      .run();
    return result.meta.changes === 1 ? "renamed" : "cooldown";
  } catch (error: unknown) {
    if (uniqueConflict(error)) return "collision";
    throw error;
  }
};

export const deletePlayer = async (env: Env, tokenHash: string): Promise<void> => {
  const db = database(env);
  await db.delete(players).where(eq(players.tokenHash, tokenHash)).run();
  await db
    .delete(rateLimits)
    .where(eq(rateLimits.keyHash, `write:${tokenHash}`))
    .run();
  await db
    .delete(rateLimits)
    .where(eq(rateLimits.keyHash, `read:${tokenHash}`))
    .run();
};
