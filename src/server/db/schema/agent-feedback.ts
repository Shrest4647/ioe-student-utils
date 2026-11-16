import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {
  feedbackImpacts,
  feedbackKinds,
  feedbackStatuses,
} from "@/lib/mcp/feedback";
import { user } from "../schema";

export const agentFeedback = pgTable(
  "agent_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    clientId: text("client_id"),
    apiKeyId: text("api_key_id"),
    agentName: text("agent_name"),
    agentVersion: text("agent_version"),
    serverName: text("server_name").notNull(),
    serverVersion: text("server_version").notNull(),
    environment: text("environment").notNull(),
    kind: text("kind", { enum: feedbackKinds }).notNull(),
    impact: text("impact", { enum: feedbackImpacts }).notNull(),
    status: text("status", { enum: feedbackStatuses })
      .notNull()
      .default("open"),
    task: text("task").notNull(),
    description: text("description").notNull(),
    operation: text("operation"),
    error: text("error"),
    suggestion: text("suggestion"),
    fingerprint: text("fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agent_feedback_created_idx").on(table.createdAt),
    index("agent_feedback_user_created_idx").on(table.userId, table.createdAt),
    index("agent_feedback_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
    index("agent_feedback_fingerprint_idx").on(table.fingerprint),
  ],
);
