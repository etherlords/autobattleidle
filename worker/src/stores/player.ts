import type { Env, Player } from "../shared/types";

const BOARD_CAPACITY = 10_000;
export type IdentityCreation = "capacity" | "collision" | "created";
export type RenameResult = "collision" | "cooldown" | "renamed";

const uniqueConflict = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("UNIQUE constraint");

export const createPlayer = async (
  env: Env,
  tokenHash: string,
  name: string,
  now: number,
): Promise<IdentityCreation> => {
  try {
    const statement = `INSERT INTO players(token_hash, display_name, achieved_at, created_at, updated_at)
SELECT ?, ?, ?, ?, ?
WHERE (SELECT COUNT(*) FROM players) < ?`;
    const result = await env.DB.prepare(statement)
      .bind(tokenHash, name, now, now, now, BOARD_CAPACITY)
      .run();
    if (result.meta.changes === 1) {
      return "created";
    }
    return "capacity";
  } catch (error: unknown) {
    if (uniqueConflict(error)) {
      return "collision";
    }
    throw error;
  }
};

export const playerFor = (env: Env, tokenHash: string): Promise<Player | null> =>
  env.DB.prepare(
    `SELECT id, display_name, best_level, achieved_at
FROM players
WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<Player>();

export const submitScore = (
  env: Env,
  tokenHash: string,
  level: number,
  now: number,
): Promise<unknown> =>
  env.DB.prepare(
    `UPDATE players SET best_level = MAX(best_level, ?),
    achieved_at = CASE WHEN ? > best_level THEN ? ELSE achieved_at END,
    updated_at = ?
WHERE token_hash = ?`,
  )
    .bind(level, level, now, now, tokenHash)
    .run();

export const renamePlayer = async (
  env: Env,
  tokenHash: string,
  name: string,
  now: number,
): Promise<RenameResult> => {
  try {
    const statement = `UPDATE players SET display_name = ?, renamed_at = ?, updated_at = ?
WHERE token_hash = ?
  AND (renamed_at IS NULL OR renamed_at <= ?)`;
    const result = await env.DB.prepare(statement)
      .bind(name, now, now, tokenHash, now - 86_400_000)
      .run();
    if (result.meta.changes === 1) {
      return "renamed";
    }
    return "cooldown";
  } catch (error: unknown) {
    if (uniqueConflict(error)) {
      return "collision";
    }
    throw error;
  }
};

export const deletePlayer = async (env: Env, tokenHash: string): Promise<void> => {
  await env.DB.prepare(
    `DELETE FROM players
WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE key_hash = ?")
    .bind(`write:${tokenHash}`)
    .run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE key_hash = ?")
    .bind(`read:${tokenHash}`)
    .run();
};
