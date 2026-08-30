import { hmac } from "./http";
import type { Env } from "./types";

export const normalizedName = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  const allowed = /^[A-Za-z0-9 ]{3,24}$/.test(name);
  const reserved = /admin|moderator|fuck|shit/i.test(name);
  if (!allowed || reserved) {
    return undefined;
  }
  return name;
};

export const networkKey = async (request: Request, env: Env): Promise<string> =>
  hmac(env.IP_HASH_KEY, request.headers.get("CF-Connecting-IP") ?? "unknown");

export const generatedName = (tokenHash: string, attempt: number): string =>
  `Amber Lynx ${tokenHash.slice(0, 10)}${attempt.toString(36).padStart(2, "0")}`;

export const renamedName = (name: string, tokenHash: string, attempt: number): string => {
  if (attempt === 0) {
    return name;
  }
  const suffix = `${tokenHash.slice(0, 4)}${attempt.toString(36).padStart(2, "0")}`;
  return `${name.slice(0, 17)} ${suffix}`;
};
