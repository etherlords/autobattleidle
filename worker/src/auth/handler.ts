import { playerForToken } from "./service";
import { bearer, json } from "../shared/http";
import type { Authorized, Env } from "../shared/types";

export const authenticate = async (
  request: Request,
  env: Env,
  origin: string,
): Promise<Authorized | Response> => {
  const hash = await bearer(request);
  if (hash === undefined) return json({ error: "auth" }, 401, origin);
  const player = await playerForToken(env, hash);
  return player === undefined ? json({ error: "auth" }, 401, origin) : { hash, player };
};
