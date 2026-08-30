import type { Env } from "./types";

export const json = (value: unknown, status = 200, origin?: string): Response =>
  new Response(JSON.stringify(value), {
    headers: {
      "access-control-allow-origin": origin ?? "",
      "content-type": "application/json",
      vary: "Origin",
    },
    status,
  });

export const empty = (origin: string): Response =>
  new Response(null, {
    headers: { "access-control-allow-origin": origin, vary: "Origin" },
    status: 204,
  });

export const originFor = (request: Request, env: Env): string | undefined => {
  const origin = request.headers.get("Origin") ?? "";
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim());
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  return undefined;
};

export const preflight = (origin: string | undefined): Response =>
  new Response(null, {
    headers: {
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "DELETE, GET, OPTIONS, POST",
      "access-control-allow-origin": origin ?? "",
      vary: "Origin",
    },
  });

export const body = async (request: Request): Promise<Record<string, unknown> | undefined> => {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return undefined;
  }
  return request.json().catch(() => undefined);
};

export const hash = async (value: string): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const hmac = async (keyValue: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyValue),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const bearer = async (request: Request): Promise<string | undefined> => {
  const value = request.headers.get("Authorization");
  if (value?.startsWith("Bearer ") !== true) {
    return undefined;
  }
  return hash(value.slice(7));
};
