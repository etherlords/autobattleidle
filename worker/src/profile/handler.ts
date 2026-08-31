import { permitRequest } from "../identity/handler";
import { body, empty, json } from "../shared/http";
import { normalizedName } from "../shared/policy";
import type { Authorized, Env } from "../shared/types";
import { renameProfile as rename, submitLevel as submit } from "./service";

const validMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000_000;

export const submitLevel = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "write", context.hash)))
    return json({ error: "rate-limit" }, 429, origin);
  const payload = await body(request);
  const level = payload?.level;
  const goldenBugs = payload?.goldenBugs ?? 0;
  if (!validMetric(level)) return json({ error: "level" }, 400, origin);
  if (!validMetric(goldenBugs)) return json({ error: "goldenBugs" }, 400, origin);
  await submit(env, { goldenBugs, level, now: Date.now(), tokenHash: context.hash });
  return empty(origin);
};

export const renameProfile = async (
  request: Request,
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "write", context.hash)))
    return json({ error: "rate-limit" }, 429, origin);
  const name = normalizedName((await body(request))?.name);
  if (name === undefined) return json({ error: "name" }, 400, origin);
  const result = await rename(env, { name, now: Date.now(), tokenHash: context.hash });
  if (result === "cooldown") return json({ error: "rename-cooldown" }, 429, origin);
  if (result === "collision") return json({ error: "name" }, 409, origin);
  return json(
    { identity: { name: result.name, token: request.headers.get("Authorization")?.slice(7) } },
    200,
    origin,
  );
};
