import { generatedName } from "../shared/policy";
import { permit } from "../repositories/rate-limit-repository";
import type { Env } from "../shared/types";
import { createPlayer, deletePlayer } from "../repositories/player-repository";

export type IdentityCreationResult =
  | { readonly kind: "capacity" }
  | { readonly kind: "created"; readonly name: string }
  | { readonly kind: "unavailable" };

export const createIdentity = async (
  env: Env,
  input: { readonly now: number; readonly tokenHash: string },
): Promise<IdentityCreationResult> => {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const name = generatedName(input.tokenHash, attempt);
    const result = await createPlayer(env, input.tokenHash, name, input.now);
    if (result === "created") return { kind: "created", name };
    if (result === "capacity") return { kind: "capacity" };
  }
  return { kind: "unavailable" };
};

export const deleteIdentity = (env: Env, tokenHash: string): Promise<unknown> =>
  deletePlayer(env, tokenHash);

export const permitRequest = (
  env: Env,
  input: { readonly keys: readonly string[]; readonly now: number },
): Promise<boolean> => permit(env, input.keys, input.now);
