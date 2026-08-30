export type LeaderboardEntry = {
  readonly name: string;
  readonly rank: number;
  readonly level: number;
};

export type LeaderboardView = {
  readonly entries: readonly LeaderboardEntry[];
  readonly me: LeaderboardEntry | null;
};

export type LeaderboardIdentity = { readonly token: string; readonly name: string };
