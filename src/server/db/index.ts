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

const databaseUrl = new URL(appEnv.DATABASE_URL);
const isNeonLocal = ["localhost", "127.0.0.1"].includes(databaseUrl.hostname);
const conn =
  globalForDb.conn ??
  postgres(
    appEnv.DATABASE_URL,
    isNeonLocal ? { ssl: { rejectUnauthorized: false } } : {},
  );
if (appEnv.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle({ client: conn, schema, relations });
export { conn };
