import type { Env, Player, RankedEntry } from "../shared/types";

export const topEntries = async (env: Env, limit: number): Promise<readonly RankedEntry[]> => {
  const statement = `SELECT display_name, best_level
FROM players
ORDER BY best_level DESC, achieved_at ASC, id ASC
LIMIT ?`;
  const result = await env.DB.prepare(statement).bind(limit).all<Player>();
  return result.results.map((player, index) => ({
    level: player.best_level,
    name: player.display_name,
    rank: index + 1,
  }));
};

export const aroundEntries = async (
  env: Env,
  player: Player,
  limit: number,
): Promise<{ readonly entries: readonly RankedEntry[]; readonly me: RankedEntry }> => {
  const rankStatement = `SELECT COUNT(*) AS count
FROM players
WHERE best_level > ?
   OR (best_level = ? AND (achieved_at < ? OR (achieved_at = ? AND id < ?)))`;
  const rank = await env.DB.prepare(rankStatement)
    .bind(player.best_level, player.best_level, player.achieved_at, player.achieved_at, player.id)
    .first<{ count: number }>();
  const above = await rowsAbove(env, player, limit);
  const below = await rowsBelow(env, player, limit);
  const currentRank = (rank?.count ?? 0) + 1;
  const rows = [...above].reverse().concat(player, ...below);
  return {
    entries: rows.map((row, index) => ({
      level: row.best_level,
      name: row.display_name,
      rank: currentRank - above.length + index,
    })),
    me: { level: player.best_level, name: player.display_name, rank: currentRank },
  };
};

const rowsAbove = async (env: Env, player: Player, limit: number): Promise<readonly Player[]> =>
  (
    await env.DB.prepare(
      `SELECT id, display_name, best_level, achieved_at
FROM players
WHERE best_level > ?
   OR (best_level = ? AND (achieved_at < ? OR (achieved_at = ? AND id < ?)))
ORDER BY best_level ASC, achieved_at DESC, id DESC
LIMIT ?`,
    )
      .bind(
        player.best_level,
        player.best_level,
        player.achieved_at,
        player.achieved_at,
        player.id,
        limit,
      )
      .all<Player>()
  ).results;

const rowsBelow = async (env: Env, player: Player, limit: number): Promise<readonly Player[]> =>
  (
    await env.DB.prepare(
      `SELECT id, display_name, best_level, achieved_at
FROM players
WHERE best_level < ?
   OR (best_level = ? AND (achieved_at > ? OR (achieved_at = ? AND id > ?)))
ORDER BY best_level DESC, achieved_at ASC, id ASC
LIMIT ?`,
    )
      .bind(
        player.best_level,
        player.best_level,
        player.achieved_at,
        player.achieved_at,
        player.id,
        limit,
      )
      .all<Player>()
  ).results;
