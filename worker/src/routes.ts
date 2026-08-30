import { createIdentity, deleteIdentity } from "./identity/handler";
import { renameProfile, submitLevel } from "./profile/handler";
import { around, top } from "./ranking/handler";
import { bearer, json, originFor, preflight } from "./shared/http";
import type { Authorized, Env } from "./shared/types";
import { playerFor } from "./stores/player";

export type { Env } from "./shared/types";

const authenticate = async (
  request: Request,
  env: Env,
  origin: string,
): Promise<Authorized | Response> => {
  const hash = await bearer(request);
  if (hash === undefined) {
    return json({ error: "auth" }, 401, origin);
  }

  const player = await playerFor(env, hash);
  if (player === null) {
    return json({ error: "auth" }, 401, origin);
  }

  return { hash, player };
};

const authenticated = async (
  request: Request,
  env: Env,
  origin: string,
  path: string,
): Promise<Response> => {
  const context = await authenticate(request, env, origin);
  if (context instanceof Response) {
    return context;
  }

  if (request.method === "GET" && path === "/v1/top") {
    return top(request, env, origin, context);
  }

  if (request.method === "GET" && path === "/v1/around") {
    return around(request, env, origin, context);
  }

  if (request.method === "POST" && path === "/v1/score") {
    return submitLevel(request, env, origin, context);
  }

  if (request.method === "POST" && path === "/v1/name") {
    return renameProfile(request, env, origin, context);
  }

  if (request.method === "DELETE" && path === "/v1/identity") {
    return deleteIdentity(env, origin, context);
  }

  return json({ error: "not-found" }, 404, origin);
};

export const handler = {
  async fetch(request, env): Promise<Response> {
    const origin = originFor(request, env);
    if (request.method === "OPTIONS") {
      if (origin === undefined) {
        return json({ error: "origin" }, 403);
      }
      return preflight(origin);
    }

    if (origin === undefined) {
      return json({ error: "origin" }, 403);
    }

    const path = new URL(request.url).pathname;
    if (request.method === "POST" && path === "/v1/identity") {
      return createIdentity(request, env, origin);
    }

    return authenticated(request, env, origin, path);
  },
} satisfies ExportedHandler<Env>;

export default handler;
