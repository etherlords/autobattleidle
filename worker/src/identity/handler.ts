import {
  createIdentity as create,
  deleteIdentity as remove,
  permitRequest as permit,
} from "./service";
import { empty, hash, json } from "../shared/http";
import { networkKey } from "../shared/policy";
import type { Authorized, Env } from "../shared/types";

export const createIdentity = async (
  request: Request,
  env: Env,
  origin: string,
): Promise<Response> => {
  if (!(await permitRequest(request, env, "create")))
    return json({ error: "rate-limit" }, 429, origin);
  const token = randomToken();
  const result = await create(env, { now: Date.now(), tokenHash: await hash(token) });
  if (result.kind === "created")
    return json({ identity: { name: result.name, token } }, 201, origin);
  return json({ error: result.kind === "capacity" ? "capacity" : "identity" }, 503, origin);
};

export const deleteIdentity = async (
  env: Env,
  origin: string,
  context: Authorized,
): Promise<Response> => {
  await remove(env, context.hash);
  return empty(origin);
};

export const permitRequest = async (
  request: Request,
  env: Env,
  scope: "create" | "read" | "write",
  identity?: string,
): Promise<boolean> => {
  const network = await networkKey(request, env);
  const keys =
    identity === undefined
      ? [`${scope}:${network}`]
      : [`${scope}:${identity}`, `${scope}:${network}`];
  return permit(env, { keys, now: Date.now() });
};

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
};
