import { Elysia, t } from "elysia";
import {
  listAgentFeedback,
  updateAgentFeedbackStatus,
} from "@/server/services/agent-feedback";
import { authorizationPlugin } from "../plugins/authorization";

const kindSchema = t.Union([
  t.Literal("missing"),
  t.Literal("broken"),
  t.Literal("confusing"),
  t.Literal("idea"),
]);
const impactSchema = t.Union([
  t.Literal("blocked"),
  t.Literal("worked_around"),
  t.Literal("friction"),
]);
const statusSchema = t.Union([
  t.Literal("open"),
  t.Literal("reviewed"),
  t.Literal("resolved"),
  t.Literal("dismissed"),
]);

export const agentFeedbackRoutes = new Elysia({ prefix: "/agent-feedback" })
  .use(authorizationPlugin)
  .onError(({ code, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false as const,
        error: "Check the feedback filters, report ID, and review status.",
      };
    }
  })
  .onAfterHandle(({ set }) => {
    set.headers["cache-control"] = "no-store";
  })
  .get(
    "/",
    async ({ query, user, set }) => {
      if (user.role !== "admin") {
        set.status = 403;
        return {
          success: false as const,
          error: "Administrator access is required.",
        };
      }
      try {
        return { success: true as const, data: await listAgentFeedback(query) };
      } catch {
        set.status = 500;
        return {
          success: false as const,
          error: "Unable to load agent feedback. Please try again.",
        };
      }
    },
    {
      sessionAuth: true,
      query: t.Object({
        kind: t.Optional(kindSchema),
        impact: t.Optional(impactSchema),
        status: t.Optional(statusSchema),
        limit: t.Optional(
          t.Numeric({ minimum: 1, maximum: 100, multipleOf: 1 }),
        ),
        offset: t.Optional(
          t.Numeric({ minimum: 0, maximum: 10000, multipleOf: 1 }),
        ),
      }),
      detail: {
        tags: ["Agent Feedback"],
        summary: "Review private agent feedback (administrators only)",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      if (user.role !== "admin") {
        set.status = 403;
        return {
          success: false as const,
          error: "Administrator access is required.",
        };
      }
      try {
        const report = await updateAgentFeedbackStatus(params.id, body.status);
        if (!report) {
          set.status = 404;
          return {
            success: false as const,
            error: "Feedback report not found.",
          };
        }
        return { success: true as const, data: report };
      } catch {
        set.status = 500;
        return {
          success: false as const,
          error: "Unable to update this report. Please try again.",
        };
      }
    },
    {
      sessionAuth: true,
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: t.Object({ status: statusSchema }),
      detail: {
        tags: ["Agent Feedback"],
        summary: "Update feedback review status (administrators only)",
      },
    },
  );
