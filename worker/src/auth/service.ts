import type { Env, Player } from "../shared/types";
import { playerFor } from "../repositories/player-repository";

export const playerForToken = (env: Env, hash: string): Promise<Player | undefined> =>
  playerFor(env, hash);
