import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { appEnv } from "@/env";
import { relations } from "./relations";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(appEnv.DATABASE_URL);
if (appEnv.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle({ client: conn, schema, relations });
