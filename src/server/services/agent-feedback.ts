import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import {
  type FeedbackInput,
  type FeedbackStatus,
  feedbackInputSchema,
  redactFeedbackText,
  sanitizeFeedback,
} from "@/lib/mcp/feedback";
import { db } from "@/server/db";
import { agentFeedback } from "@/server/db/schema";
import { mcpServerInfo } from "@/server/mcp/metadata";

export interface FeedbackIdentity {
  userId: string;
  clientId?: string;
  apiKeyId?: string;
  agentName?: string;
  agentVersion?: string;
}
export interface FeedbackSubmission {
  accepted: boolean;
  duplicate?: boolean;
  id?: string;
  message: string;
}
export interface FeedbackFilters {
  kind?: FeedbackInput["kind"];
  impact?: FeedbackInput["impact"];
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}

export async function submitAgentFeedback(
  rawInput: FeedbackInput,
  identity: FeedbackIdentity,
  database: typeof db = db,
): Promise<FeedbackSubmission> {
  if (!identity.userId)
    throw new Error("Authentication is required to submit feedback.");
  const input = sanitizeFeedback(feedbackInputSchema.parse(rawInput));
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        identity.userId,
        identity.clientId || identity.apiKeyId,
        input,
      ]),
    )
    .digest("hex");
  return database.transaction(async (tx) => {
    // Serialize this low-volume inbox so limits and retry deduplication are atomic.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('ioesu-agent-feedback'))`,
    );
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [duplicate] = await tx
      .select({ id: agentFeedback.id })
      .from(agentFeedback)
      .where(
        and(
          eq(agentFeedback.fingerprint, fingerprint),
          gte(agentFeedback.createdAt, since),
        ),
      )
      .limit(1);
    if (duplicate)
      return {
        accepted: true,
        duplicate: true,
        id: duplicate.id,
        message:
          "This report was already received. Continue your task without resubmitting.",
      };
    const [total] = await tx
      .select({ value: count() })
      .from(agentFeedback)
      .where(gte(agentFeedback.createdAt, since));
    const [own] = await tx
      .select({ value: count() })
      .from(agentFeedback)
      .where(
        and(
          eq(agentFeedback.userId, identity.userId),
          gte(agentFeedback.createdAt, since),
        ),
      );
    if (total.value >= 100 || own.value >= 20)
      return {
        accepted: false,
        message:
          "The feedback limit has been reached. Do not retry this report; continue your task.",
      };
    const [saved] = await tx
      .insert(agentFeedback)
      .values({
        ...input,
        userId: identity.userId,
        clientId: identity.clientId,
        apiKeyId: identity.apiKeyId,
        agentName: identity.agentName
          ? redactFeedbackText(identity.agentName.slice(0, 200))
          : null,
        agentVersion: identity.agentVersion
          ? redactFeedbackText(identity.agentVersion.slice(0, 100))
          : null,
        serverName: mcpServerInfo.name,
        serverVersion: mcpServerInfo.version,
        environment: process.env.NODE_ENV || "development",
        fingerprint,
      })
      .returning({ id: agentFeedback.id });
    return {
      accepted: true,
      id: saved.id,
      message:
        "Feedback received by IOE Student Utils maintainers. Continue your task; no further report is needed for this issue.",
    };
  });
}

export async function listAgentFeedback(
  filters: FeedbackFilters = {},
  database: typeof db = db,
) {
  const where = and(
    filters.kind ? eq(agentFeedback.kind, filters.kind) : undefined,
    filters.impact ? eq(agentFeedback.impact, filters.impact) : undefined,
    filters.status ? eq(agentFeedback.status, filters.status) : undefined,
  );
  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const offset = Math.max(filters.offset ?? 0, 0);
  const [rows, totals] = await Promise.all([
    database
      .select()
      .from(agentFeedback)
      .where(where)
      .orderBy(desc(agentFeedback.createdAt), desc(agentFeedback.id))
      .limit(limit)
      .offset(offset),
    database.select({ total: count() }).from(agentFeedback).where(where),
  ]);
  // The deduplication fingerprint is an internal implementation detail.
  return {
    reports: rows.map(({ fingerprint: _fingerprint, ...report }) => report),
    total: totals[0].total,
    limit,
    offset,
  };
}

export async function updateAgentFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  database: typeof db = db,
) {
  const [report] = await database
    .update(agentFeedback)
    .set({ status, updatedAt: new Date() })
    .where(eq(agentFeedback.id, id))
    .returning({ id: agentFeedback.id, status: agentFeedback.status });
  return report;
}
