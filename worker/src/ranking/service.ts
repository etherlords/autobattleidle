import type { Env, Player, RankingMode } from "../shared/types";
import { aroundEntries, rankedEntry, topEntries } from "../repositories/ranking-repository";

const TOP_LIMIT = 100;
const AROUND_LIMIT = 10;

export const top = async (env: Env, player: Player, mode: RankingMode) => {
  const [entries, me] = await Promise.all([
    topEntries(env, TOP_LIMIT, mode),
    rankedEntry(env, player, mode),
  ]);
  return { entries, me };
};

export const around = (env: Env, player: Player, mode: RankingMode) =>
  aroundEntries(env, player, AROUND_LIMIT, mode);
