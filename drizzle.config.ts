import { type Config } from "drizzle-kit";

import { appEnv } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: appEnv.DATABASE_URL,
  },
  tablesFilter: ["nothing_*"],
} satisfies Config;
