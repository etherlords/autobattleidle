import { permitRequest } from "../identity/handler";
import { body, empty, json } from "../shared/http";
import { normalizedName, renamedName } from "../shared/policy";
import type { Authorized, Env } from "../shared/types";
import { renamePlayer, submitScore } from "../stores/player";

export const submitLevel = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "write", context.hash))) {
    return json({ error: "rate-limit" }, 429, origin);
  }

  const level = (await body(request))?.level;
  if (!Number.isInteger(level) || typeof level !== "number" || level < 0 || level > 1_000_000_000) {
    return json({ error: "level" }, 400, origin);
  }

  await submitScore(env, context.hash, level, Date.now());
  return empty(origin);
};

export const renameProfile = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "write", context.hash))) {
    return json({ error: "rate-limit" }, 429, origin);
  }

  const name = normalizedName((await body(request))?.name);
  if (name === undefined) {
    return json({ error: "name" }, 400, origin);
  }

  for (let attempt = 0; attempt < 32; attempt += 1) {
    const result = await renamePlayer(
      env,
      context.hash,
      renamedName(name, context.hash, attempt),
      Date.now(),
    );
    if (result === "renamed") {
      return identityResponse(request, origin, name, context.hash, attempt);
    }
    if (result === "cooldown") {
      return json({ error: "rename-cooldown" }, 429, origin);
    }
  }
  return json({ error: "name" }, 409, origin);
};

const identityResponse = (
  request: Request,
  origin: string,
  name: string,
  tokenHash: string,
  attempt: number,
): Response =>
  json(
    {
      identity: {
        name: renamedName(name, tokenHash, attempt),
        token: request.headers.get("Authorization")?.slice(7),
      },
    },
    200,
    origin,
  );
