export type Env = {
  readonly DB: D1Database;
  readonly ALLOWED_ORIGINS: string;
  readonly IP_HASH_KEY: string;
};

export type Player = {
  readonly id: number;
  readonly display_name: string;
  readonly best_level: number;
  readonly achieved_at: number;
};

export type RankedEntry = { readonly level: number; readonly name: string; readonly rank: number };

export type Authorized = { readonly hash: string; readonly player: Player };
