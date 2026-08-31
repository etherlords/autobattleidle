import type {
  LeaderboardEntry,
  LeaderboardIdentity,
  LeaderboardView,
  RankingMode,
} from "./contracts";

const identityKey = "etherlords.autobattleidle.leaderboard.identity.v1";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type LeaderboardEntries = readonly LeaderboardEntry[];
type LeaderboardMine = LeaderboardEntry | null;
type ResponseBody = {
  readonly identity?: LeaderboardIdentity;
  readonly entries?: LeaderboardEntries;
  readonly me?: LeaderboardMine;
};
type ErrorKind = "rate-limited" | "request-failed";
export type LeaderboardError = Error & { readonly kind: ErrorKind };
const requestError = (kind: ErrorKind): LeaderboardError =>
  Object.assign(
    new Error(
      kind === "rate-limited" ? "Leaderboard is rate limited." : "Leaderboard request failed.",
    ),
    { kind },
  );

const endpoint = (): string | undefined => import.meta.env.VITE_LEADERBOARD_API;

const readIdentity = (storage: StorageLike): LeaderboardIdentity | undefined => {
  const value = storage.getItem(identityKey);
  if (value === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "token" in parsed &&
      "name" in parsed &&
      typeof parsed.token === "string" &&
      typeof parsed.name === "string"
    )
      return { token: parsed.token, name: parsed.name };
  } catch {
    // A malformed independent identity never affects a game save.
  }
  storage.removeItem(identityKey);
  return undefined;
};

export class LeaderboardClient {
  private identity: LeaderboardIdentity | undefined;

  constructor(
    private readonly storage: StorageLike = globalThis.localStorage,
    private readonly request: typeof fetch = globalThis.fetch.bind(globalThis),
    private readonly api = endpoint(),
  ) {
    this.identity = readIdentity(storage);
  }

  async load(around = false, mode: RankingMode = "level"): Promise<LeaderboardView> {
    const body = await this.call(`${around ? "/v1/around" : "/v1/top"}?mode=${mode}`);
    return { entries: body.entries ?? [], me: body.me ?? null };
  }

  async submit(level: number, goldenBugs = 0): Promise<void> {
    await this.call("/v1/score", { goldenBugs, level });
  }

  async rename(name: string): Promise<void> {
    const body = await this.call("/v1/name", { name });
    if (body.identity !== undefined) this.store(body.identity);
  }

  async reset(): Promise<void> {
    await this.call("/v1/identity", undefined, "DELETE");
    this.identity = undefined;
    this.storage.removeItem(identityKey);
  }

  // eslint-disable-next-line complexity -- one narrow HTTP boundary keeps identity handling local.
  private async call(
    path: string,
    body?: object,
    method = body === undefined ? "GET" : "POST",
  ): Promise<ResponseBody> {
    const base = this.api;
    if (base === undefined || base.length === 0) throw new Error("Leaderboard is not configured.");
    if (this.identity === undefined && path !== "/v1/identity") await this.createIdentity();
    const headers = this.headers(body);
    const response = await this.request(`${base}${path}`, {
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      headers,
      method,
    });
    if (response.status === 204) return {};
    const parsed: unknown = await response.json();
    if (!response.ok)
      throw requestError(response.status === 429 ? "rate-limited" : "request-failed");
    return typeof parsed === "object" && parsed !== null ? (parsed as ResponseBody) : {};
  }

  private headers(body: object | undefined): Record<string, string> {
    const headers = body === undefined ? {} : { "content-type": "application/json" };
    return this.identity === undefined
      ? headers
      : { ...headers, authorization: `Bearer ${this.identity.token}` };
  }

  private async createIdentity(): Promise<void> {
    const body = await this.call("/v1/identity", {}, "POST");
    if (body.identity === undefined) throw new Error("Leaderboard identity was not returned.");
    this.store(body.identity);
  }

  private store(identity: LeaderboardIdentity): void {
    this.identity = identity;
    this.storage.setItem(identityKey, JSON.stringify(identity));
  }
}
