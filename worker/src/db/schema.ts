import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  displayName: text("display_name").notNull(),
  bestLevel: integer("best_level").notNull(),
  achievedAt: integer("achieved_at").notNull(),
  bestGoldenBugs: integer("best_golden_bugs").notNull(),
  goldenBugsAchievedAt: integer("golden_bugs_achieved_at").notNull(),
  renamedAt: integer("renamed_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
