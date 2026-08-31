import { permitRequest } from "../identity/handler";
import { json } from "../shared/http";
import type { Authorized, Env, RankingMode } from "../shared/types";
import { around as aroundEntries, top as topEntries } from "./service";

const mode = (request: Request): RankingMode =>
  new URL(request.url).searchParams.get("mode") === "golden-bugs" ? "golden-bugs" : "level";

export const top = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "read", context.hash)))
    return json({ error: "rate-limit" }, 429, origin);
  return json(await topEntries(env, context.player, mode(request)), 200, origin);
};

export const around = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "read", context.hash)))
    return json({ error: "rate-limit" }, 429, origin);
  return json(await aroundEntries(env, context.player, mode(request)), 200, origin);
};
