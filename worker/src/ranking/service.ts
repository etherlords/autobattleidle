import type { Env, Player, RankedEntry, RankingMode } from "../shared/types";
import { aroundEntries, topEntries } from "../repositories/ranking-repository";

const LIMIT = 100;

export const top = (env: Env, mode: RankingMode): Promise<readonly RankedEntry[]> =>
  topEntries(env, LIMIT, mode);

export const around = (env: Env, player: Player, mode: RankingMode) =>
  aroundEntries(env, player, LIMIT, mode);
