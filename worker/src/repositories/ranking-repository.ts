import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";
import { database } from "../db/client";
import { players } from "../db/schema";
import type { Env, Player, RankedEntry, RankingMode } from "../shared/types";

const playerFields = {
  achieved_at: players.achievedAt,
  best_golden_bugs: players.bestGoldenBugs,
  best_level: players.bestLevel,
  display_name: players.displayName,
  golden_bugs_achieved_at: players.goldenBugsAchievedAt,
  id: players.id,
};
const columns = (mode: RankingMode) =>
  mode === "level"
    ? { metric: players.bestLevel, time: players.achievedAt }
    : { metric: players.bestGoldenBugs, time: players.goldenBugsAchievedAt };
const entry = (player: Player, rank: number): RankedEntry => ({
  goldenBugs: player.best_golden_bugs,
  level: player.best_level,
  name: player.display_name,
  rank,
});

export const topEntries = async (
  env: Env,
  limit: number,
  mode: RankingMode,
): Promise<readonly RankedEntry[]> => {
  const { metric, time } = columns(mode);
  const rows = await database(env)
    .select(playerFields)
    .from(players)
    .orderBy(desc(metric), asc(time), asc(players.id))
    .limit(limit)
    .all();
  return rows.map((player, index) => entry(player, index + 1));
};

export const rankedEntry = async (
  env: Env,
  player: Player,
  mode: RankingMode,
): Promise<RankedEntry> => {
  const rank = await database(env)
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(aheadOf(player, mode))
    .get();
  return entry(player, (rank?.count ?? 0) + 1);
};

export const aroundEntries = async (
  env: Env,
  player: Player,
  limit: number,
  mode: RankingMode,
): Promise<{ readonly entries: readonly RankedEntry[]; readonly me: RankedEntry }> => {
  const db = database(env);
  const { metric, time } = columns(mode);
  const ahead = aheadOf(player, mode);
  const rank = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(ahead)
    .get();
  const [above, below] = await Promise.all([
    db
      .select(playerFields)
      .from(players)
      .where(ahead)
      .orderBy(asc(metric), desc(time), desc(players.id))
      .limit(limit)
      .all(),
    db
      .select(playerFields)
      .from(players)
      .where(behind(player, mode))
      .orderBy(desc(metric), asc(time), asc(players.id))
      .limit(limit)
      .all(),
  ]);
  const currentRank = (rank?.count ?? 0) + 1;
  const rows = [...above].reverse().concat(player, ...below);
  return {
    entries: rows.map((row, index) => ({
      ...entry(row, currentRank - above.length + index),
    })),
    me: entry(player, currentRank),
  };
};

const aheadOf = (player: Player, mode: RankingMode) => {
  const { metric, time } = columns(mode);
  const value = mode === "level" ? player.best_level : player.best_golden_bugs;
  const timestamp = mode === "level" ? player.achieved_at : player.golden_bugs_achieved_at;
  return or(
    gt(metric, value),
    and(
      eq(metric, value),
      or(lt(time, timestamp), and(eq(time, timestamp), lt(players.id, player.id))),
    ),
  );
};

const behind = (player: Player, mode: RankingMode) => {
  const { metric, time } = columns(mode);
  const value = mode === "level" ? player.best_level : player.best_golden_bugs;
  const timestamp = mode === "level" ? player.achieved_at : player.golden_bugs_achieved_at;
  return or(
    lt(metric, value),
    and(
      eq(metric, value),
      or(gt(time, timestamp), and(eq(time, timestamp), gt(players.id, player.id))),
    ),
  );
};
