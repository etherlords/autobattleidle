import { empty, hash, json } from "../shared/http";
import { generatedName, networkKey } from "../shared/policy";
import { permit } from "../shared/rate-limit";
import type { Authorized, Env } from "../shared/types";
import { createPlayer, deletePlayer } from "../stores/player";

export const createIdentity = async (
  request: Request,
  env: Env,
  origin: string,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "create"))) {
    return json({ error: "rate-limit" }, 429, origin);
  }

  const token = randomToken();
  const tokenHash = await hash(token);
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const name = generatedName(tokenHash, attempt);
    const result = await createPlayer(env, tokenHash, name, Date.now());
    if (result === "created") {
      return json({ identity: { name, token } }, 201, origin);
    }
    if (result === "capacity") {
      return json({ error: "capacity" }, 503, origin);
    }
  }
  return json({ error: "identity" }, 503, origin);
};

export const deleteIdentity = async (
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  await deletePlayer(env, context.hash);
  return empty(origin);
};

export const permitRequest = async (
  request: Request,
  env: Env,
  scope: "create" | "read" | "write",
  identity?: string,
): Promise<boolean> => {
  const network = await networkKey(request, env);
  if (identity === undefined) {
    return permit(env, [`${scope}:${network}`], Date.now());
  }

  const keys = [`${scope}:${identity}`, `${scope}:${network}`];
  return permit(env, keys, Date.now());
};

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
};
