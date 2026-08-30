import { permitRequest } from "../identity/handler";
import { json } from "../shared/http";
import type { Authorized, Env } from "../shared/types";
import { aroundEntries, topEntries } from "./store";

const LIMIT = 100;

export const top = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "read", context.hash))) {
    return json({ error: "rate-limit" }, 429, origin);
  }
  return json({ entries: await topEntries(env, LIMIT) }, 200, origin);
};

export const around = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "read", context.hash))) {
    return json({ error: "rate-limit" }, 429, origin);
  }
  return json(await aroundEntries(env, context.player, LIMIT), 200, origin);
};
