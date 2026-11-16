import { z } from "zod/v3";

export const feedbackKinds = [
  "missing",
  "broken",
  "confusing",
  "idea",
] as const;
export const feedbackImpacts = [
  "blocked",
  "worked_around",
  "friction",
] as const;
export const feedbackStatuses = [
  "open",
  "reviewed",
  "resolved",
  "dismissed",
] as const;

export const feedbackInputSchema = z.object({
  task: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .describe("A brief, non-personal summary of the task."),
  kind: z.enum(feedbackKinds),
  impact: z.enum(feedbackImpacts),
  description: z
    .string()
    .trim()
    .min(10)
    .max(4000)
    .describe(
      "What failed or caused friction. Summarize relevant calls; omit conversation transcripts and private data.",
    ),
  operation: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe("Name of the relevant MCP tool, if any."),
  error: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .describe("Sanitized error message, without credentials or personal data."),
  suggestion: z.string().trim().max(2000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

/** Best-effort credential removal, not a guarantee that arbitrary private text is safe. */
export function redactFeedbackText(value: string): string {
  return value
    .replace(/\b(?:Bearer|Basic)\s+[^\s,;"'<>]+/gi, "[REDACTED_AUTH]")
    .replace(
      /\b(?:ik_|sk_(?:live_|test_)?|ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]+/g,
      "[REDACTED_KEY]",
    )
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED_TOKEN]",
    )
    .replace(
      /((?:["']?)(?:client_secret|access_token|refresh_token|api[_-]?key|password|secret|authorization|cookie|set-cookie)(?:["']?)\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s&,;}]+)/gi,
      "$1[REDACTED]",
    )
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, "$1[REDACTED]@")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
}

export function sanitizeFeedback(input: FeedbackInput): FeedbackInput {
  return {
    ...input,
    task: redactFeedbackText(input.task),
    description: redactFeedbackText(input.description),
    ...(input.operation !== undefined
      ? { operation: redactFeedbackText(input.operation) }
      : {}),
    ...(input.error !== undefined
      ? { error: redactFeedbackText(input.error) }
      : {}),
    ...(input.suggestion !== undefined
      ? { suggestion: redactFeedbackText(input.suggestion) }
      : {}),
  };
}
