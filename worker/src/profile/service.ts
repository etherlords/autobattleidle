import { renamedName } from "../shared/policy";
import type { Env } from "../shared/types";
import { renamePlayer, submitScore } from "../repositories/player-repository";

export const submitLevel = async (
  env: Env,
  input: {
    readonly goldenBugs: number;
    readonly level: number;
    readonly now: number;
    readonly tokenHash: string;
  },
): Promise<unknown> => submitScore(env, input.tokenHash, input.level, input.goldenBugs, input.now);

export type RenameProfileResult = "collision" | "cooldown" | { readonly name: string };

export const renameProfile = async (
  env: Env,
  input: { readonly name: string; readonly now: number; readonly tokenHash: string },
): Promise<RenameProfileResult> => {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const candidate = renamedName(input.name, input.tokenHash, attempt);
    const result = await renamePlayer(env, input.tokenHash, candidate, input.now);
    if (result === "renamed") return { name: candidate };
    if (result === "cooldown") return "cooldown";
  }
  return "collision";
};
