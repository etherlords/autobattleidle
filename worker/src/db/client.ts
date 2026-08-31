import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../shared/types";
import * as schema from "./schema";

export const database = (env: Env) => drizzle(env.DB, { schema });
export type LeaderboardDatabase = ReturnType<typeof database>;
