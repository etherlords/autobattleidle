ALTER TABLE players ADD COLUMN best_golden_bugs INTEGER NOT NULL DEFAULT 0 CHECK (best_golden_bugs >= 0 AND best_golden_bugs <= 1000000000);
ALTER TABLE players ADD COLUMN golden_bugs_achieved_at INTEGER NOT NULL DEFAULT 0;
CREATE INDEX players_golden_bugs_rank ON players(best_golden_bugs DESC, golden_bugs_achieved_at ASC, id ASC);
