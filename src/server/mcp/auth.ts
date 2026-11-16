/**
 * MCP Authentication Module
 *
 * Handles authentication for MCP requests using Better Auth API Keys.
 * All MCP requests must include a valid API key in request headers.
 *
 * Supported headers:
 * - Authorization: Bearer <api-key>
 * - x-api-key: <api-key>
 *
 * Security:
 * - Keys are validated against Better Auth's API Key plugin
 * - Rate limiting is enforced by Better Auth
 * - Sessions can be created from API keys for user context
 *
 * @module mcp/auth
 */

import { auth } from "@/server/better-auth";

/**
 * Authentication result interface
 */
export interface AuthResult {
  valid: boolean;
  userId?: string;
  apiKeyId?: string;
  permissions?: Record<string, string[]>;
  error?: string;
}

/**
 * Extract API key from request headers
 *
 * Supports two header formats:
 * 1. Authorization: Bearer <key>
 * 2. x-api-key: <key>
 *
 * @param request - Incoming HTTP request
 * @returns API key string or null
 */
function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  // Try Authorization header with Bearer token
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try x-api-key header
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authenticate MCP request using Better Auth API Key verification
 *
 * @param request - Incoming HTTP request
 * @returns Authentication result with user information
 */
export async function authenticateMCPRequest(
  request: Request,
): Promise<AuthResult> {
  try {
    // Extract API key from headers
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      return {
        valid: false,
        error:
          "Missing API key. Include 'Authorization: Bearer <key>' or 'x-api-key: <key>' header.",
      };
    }

    // Verify API key with Better Auth (server-side)
    const data = await auth.api.verifyApiKey({
      body: { key: apiKey },
    });

    if (!data?.valid || !data?.key) {
      return {
        valid: false,
        error: "Invalid or expired API key",
      };
    }

    // Extract user information from verified key
    const keyData = data.key;

    // Parse permissions if they exist (stored as JSON string in DB)
    let permissions: Record<string, string[]> = {};
    if (keyData.permissions) {
      try {
        permissions = keyData.permissions;
      } catch (error) {
        console.error("Failed to parse permissions:", error);
      }
    }

    return {
      valid: true,
      userId: keyData.userId,
      apiKeyId: keyData.id,
      permissions,
    };
  } catch (error) {
    console.error("MCP authentication error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Check if user has required permission
 *
 * @param userPermissions - User's permissions from API key
 * @param resource - Resource type (e.g., "scholarships", "universities")
 * @param action - Action type (e.g., "read", "write", "delete")
 * @returns True if user has permission
 */
export function hasPermission(
  userPermissions: Record<string, string[]>,
  resource: string,
  action: string,
): boolean {
  const resourcePermissions = userPermissions[resource] || [];

  // Check for wildcard permission
  if (resourcePermissions.includes("*")) {
    return true;
  }

  // Check for specific action permission
  return resourcePermissions.includes(action);
}

/**
 * Permission requirements for each tool
 *
 * Maps tool names to required permissions.
 * If a tool is not listed, it's considered public (read-only).
 */
export const TOOL_PERMISSIONS = {
  submit_feedback: { resource: "mcp_feedback", action: "submit" },
  list_agent_feedback: { resource: "mcp_feedback", action: "read" },
  // Scholarship tools
  fetch_scholarships: { resource: "scholarships", action: "read" },
  get_scholarship_by_id: { resource: "scholarships", action: "read" },
  create_scholarship: { resource: "scholarships", action: "write" },
  bulk_create_scholarships: { resource: "scholarships", action: "write" },
  update_scholarship: { resource: "scholarships", action: "write" },
  bulk_update_scholarships: { resource: "scholarships", action: "write" },
  delete_scholarship: { resource: "scholarships", action: "delete" },
  bulk_delete_scholarships: { resource: "scholarships", action: "delete" },
  create_scholarship_round: { resource: "scholarships", action: "write" },
  bulk_create_scholarship_rounds: { resource: "scholarships", action: "write" },
  update_scholarship_round: { resource: "scholarships", action: "write" },
  delete_scholarship_round: { resource: "scholarships", action: "delete" },
  bulk_delete_scholarship_rounds: {
    resource: "scholarships",
    action: "delete",
  },
  create_round_event: { resource: "scholarships", action: "write" },
  bulk_create_round_events: { resource: "scholarships", action: "write" },
  update_round_event: { resource: "scholarships", action: "write" },
  delete_round_event: { resource: "scholarships", action: "delete" },
  check_duplicate_scholarship: { resource: "scholarships", action: "read" },
  validate_scholarship_data: { resource: "scholarships", action: "read" },

  // University tools
  fetch_universities: { resource: "universities", action: "read" },
  get_university_by_slug: { resource: "universities", action: "read" },
  create_university: { resource: "universities", action: "write" },
  bulk_create_universities: { resource: "universities", action: "write" },
  update_university: { resource: "universities", action: "write" },
  bulk_update_universities: { resource: "universities", action: "write" },
  delete_university: { resource: "universities", action: "delete" },
  bulk_delete_universities: { resource: "universities", action: "delete" },

  // College tools
  fetch_colleges: { resource: "colleges", action: "read" },
  get_college_by_slug: { resource: "colleges", action: "read" },
  fetch_college_departments: { resource: "colleges", action: "read" },
  fetch_college_department_programs: { resource: "colleges", action: "read" },
  fetch_college_program_courses: { resource: "colleges", action: "read" },
  create_college: { resource: "colleges", action: "write" },
  bulk_create_colleges: { resource: "colleges", action: "write" },
  update_college: { resource: "colleges", action: "write" },
  bulk_update_colleges: { resource: "colleges", action: "write" },
  delete_college: { resource: "colleges", action: "delete" },
  bulk_delete_colleges: { resource: "colleges", action: "delete" },
  sync_college_departments: { resource: "colleges", action: "write" },
  sync_college_department_programs: { resource: "colleges", action: "write" },
  sync_college_program_courses: { resource: "colleges", action: "write" },

  // Department tools
  fetch_departments: { resource: "departments", action: "read" },
  get_department_by_slug: { resource: "departments", action: "read" },
  create_department: { resource: "departments", action: "write" },
  bulk_create_departments: { resource: "departments", action: "write" },
  update_department: { resource: "departments", action: "write" },
  bulk_update_departments: { resource: "departments", action: "write" },

  // Academic (programs and courses) tools
  fetch_programs: { resource: "programs", action: "read" },
  get_program_by_code: { resource: "programs", action: "read" },
  create_program: { resource: "programs", action: "write" },
  bulk_create_programs: { resource: "programs", action: "write" },
  update_program: { resource: "programs", action: "write" },
  bulk_update_programs: { resource: "programs", action: "write" },
  delete_program: { resource: "programs", action: "delete" },
  bulk_delete_programs: { resource: "programs", action: "delete" },
  fetch_program_courses: { resource: "courses", action: "read" },
  create_course: { resource: "courses", action: "write" },
  bulk_create_courses: { resource: "courses", action: "write" },
  update_course: { resource: "courses", action: "write" },
  bulk_update_courses: { resource: "courses", action: "write" },
  delete_course: { resource: "courses", action: "delete" },
  bulk_delete_courses: { resource: "courses", action: "delete" },

  // Taxonomy & Metadata tools
  fetch_degrees: { resource: "degrees", action: "read" },
  create_degree: { resource: "degrees", action: "write" },
  update_degree: { resource: "degrees", action: "write" },
  delete_degree: { resource: "degrees", action: "delete" },
  fetch_fields_of_study: { resource: "fields_of_study", action: "read" },
  create_field_of_study: { resource: "fields_of_study", action: "write" },
  update_field_of_study: { resource: "fields_of_study", action: "write" },
  delete_field_of_study: { resource: "fields_of_study", action: "delete" },
  fetch_countries: { resource: "countries", action: "read" },
  create_country: { resource: "countries", action: "write" },
  update_country: { resource: "countries", action: "write" },
  delete_country: { resource: "countries", action: "delete" },
  lookup_taxonomy: { resource: "taxonomy", action: "read" },

  // Ratings tools
  fetch_rating_categories: { resource: "ratings", action: "read" },
  get_rating_category_by_id: { resource: "ratings", action: "read" },
  create_rating_category: { resource: "ratings", action: "write" },
  bulk_create_rating_categories: { resource: "ratings", action: "write" },
  update_rating_category: { resource: "ratings", action: "write" },
  delete_rating_category: { resource: "ratings", action: "delete" },
  submit_rating: { resource: "ratings", action: "write" },
  bulk_submit_ratings: { resource: "ratings", action: "write" },
  fetch_entity_ratings: { resource: "ratings", action: "read" },

  // Event tools
  fetch_events: { resource: "events", action: "read" },
  fetch_events_by_round: { resource: "events", action: "read" },
  fetch_upcoming_events: { resource: "events", action: "read" },
  create_event: { resource: "events", action: "write" },
  update_event: { resource: "events", action: "write" },
  delete_event: { resource: "events", action: "delete" },
  bulk_delete_round_events: { resource: "events", action: "delete" },

  // Resource tools
  fetch_resources: { resource: "resources", action: "read" },
  get_resource_by_id: { resource: "resources", action: "read" },
  fetch_resource_categories: { resource: "resources", action: "read" },
  fetch_content_types: { resource: "resources", action: "read" },
  create_resource: { resource: "resources", action: "write" },
  bulk_create_resources: { resource: "resources", action: "write" },
  update_resource: { resource: "resources", action: "write" },
  bulk_update_resources: { resource: "resources", action: "write" },
  delete_resource: { resource: "resources", action: "delete" },
  bulk_delete_resources: { resource: "resources", action: "delete" },
  create_resource_category: { resource: "resources", action: "write" },
  bulk_create_resource_categories: { resource: "resources", action: "write" },
  create_content_type: { resource: "resources", action: "write" },
  bulk_create_content_types: { resource: "resources", action: "write" },

  // Quiz tools
  fetch_quizzes: { resource: "quizzes", action: "read" },
  get_quiz_by_id: { resource: "quizzes", action: "read" },
  get_quiz_by_slug: { resource: "quizzes", action: "read" },
  create_quiz: { resource: "quizzes", action: "write" },
  update_quiz: { resource: "quizzes", action: "write" },
  archive_quiz: { resource: "quizzes", action: "delete" },
  publish_quiz: { resource: "quizzes", action: "write" },
  unpublish_quiz: { resource: "quizzes", action: "write" },
  create_question: { resource: "quizzes", action: "write" },
  update_question: { resource: "quizzes", action: "write" },
  delete_question: { resource: "quizzes", action: "delete" },
  create_option: { resource: "quizzes", action: "write" },
  update_option: { resource: "quizzes", action: "write" },
  delete_option: { resource: "quizzes", action: "delete" },
  reorder_questions: { resource: "quizzes", action: "write" },
  reorder_options: { resource: "quizzes", action: "write" },
  bulk_upsert_quiz_content: { resource: "quizzes", action: "write" },
  validate_quiz_content: { resource: "quizzes", action: "read" },
  clone_quiz: { resource: "quizzes", action: "write" },

  // Flashcard tools
  fetch_flashcard_decks: { resource: "flashcards", action: "read" },
  get_flashcard_deck_by_id: { resource: "flashcards", action: "read" },
  get_flashcard_deck_by_slug: { resource: "flashcards", action: "read" },
  create_flashcard_deck: { resource: "flashcards", action: "write" },
  update_flashcard_deck: { resource: "flashcards", action: "write" },
  archive_flashcard_deck: { resource: "flashcards", action: "delete" },
  publish_flashcard_deck: { resource: "flashcards", action: "write" },
  unpublish_flashcard_deck: { resource: "flashcards", action: "write" },
  clone_flashcard_deck: { resource: "flashcards", action: "write" },
  create_flashcard_card: { resource: "flashcards", action: "write" },
  update_flashcard_card: { resource: "flashcards", action: "write" },
  delete_flashcard_card: { resource: "flashcards", action: "delete" },
  reorder_flashcard_cards: { resource: "flashcards", action: "write" },
  bulk_upsert_flashcard_content: { resource: "flashcards", action: "write" },
  validate_flashcard_content: { resource: "flashcards", action: "read" },
  create_flashcard_tag: { resource: "flashcards", action: "write" },
  assign_flashcard_tags: { resource: "flashcards", action: "write" },
  simulate_srs_schedule: { resource: "flashcards", action: "read" },

  // Course Explorer tools
  bulk_upsert_courses: { resource: "course_explorer", action: "write" },
  bulk_upsert_units: { resource: "course_explorer", action: "write" },
  bulk_upsert_topics: { resource: "course_explorer", action: "write" },
  bulk_create_prerequisites: { resource: "course_explorer", action: "write" },
  bulk_link_resources: { resource: "course_explorer", action: "write" },
  fetch_courses: { resource: "course_explorer", action: "read" },
  get_course_structure: { resource: "course_explorer", action: "read" },
  validate_course_graph: { resource: "course_explorer", action: "write" },
  preview_course_graph_diff: { resource: "course_explorer", action: "write" },
  upsert_course_graph: { resource: "course_explorer", action: "write" },
  export_course_graph: { resource: "course_explorer", action: "read" },
} as const;

/**
 * Check if user has permission to use a tool
 *
 * @param toolName - Name of tool being called
 * @param userPermissions - User's permissions from API key
 * @returns True if user has permission to use tool
 */
export function canUseTool(
  toolName: string,
  userPermissions: Record<string, string[]>,
): boolean {
  // Feedback submission is available to every authenticated MCP identity,
  // including existing read-only keys. Authentication is enforced by the tool.
  if (toolName === "submit_feedback") return true;
  const requirement =
    TOOL_PERMISSIONS[toolName as keyof typeof TOOL_PERMISSIONS];

  // Default DENY: If no permission requirement defined, tool is denied
  if (!requirement) {
    return false;
  }

  return hasPermission(
    userPermissions,
    requirement.resource,
    requirement.action,
  );
}
