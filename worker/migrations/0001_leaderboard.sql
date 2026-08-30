CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL UNIQUE,
  best_level INTEGER NOT NULL DEFAULT 0 CHECK (best_level >= 0 AND best_level <= 1000000000),
  achieved_at INTEGER NOT NULL,
  renamed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX players_rank ON players(best_level DESC, achieved_at ASC, id ASC);
CREATE TABLE rate_limits (key_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
