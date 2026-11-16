export const mcpWriteScope = "mcp:write";
export const oauthScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  mcpWriteScope,
] as const;

const academicResources = [
  "scholarships",
  "universities",
  "colleges",
  "departments",
  "programs",
  "courses",
  "course_explorer",
  "taxonomy",
  "degrees",
  "countries",
  "fields_of_study",
  "events",
  "ratings",
  "quizzes",
  "flashcards",
  "resources",
] as const;

export function canGrantMcpWrite(role: string | null | undefined) {
  return role === "admin";
}

/** Both the MCP gateway and the REST API use the current role and consented scopes. */
export function getOAuthPermissions(
  role: string,
  scopes: readonly string[],
): Record<string, string[]> {
  const actions =
    canGrantMcpWrite(role) && scopes.includes(mcpWriteScope)
      ? ["read", "write"]
      : ["read"];
  return Object.fromEntries(
    academicResources.map((resource) => [resource, [...actions]]),
  );
}

const apiResources: Record<string, (typeof academicResources)[number]> = {
  scholarships: "scholarships",
  universities: "universities",
  colleges: "colleges",
  departments: "departments",
  programs: "programs",
  courses: "courses",
  "course-explorer": "course_explorer",
  resources: "resources",
  ratings: "ratings",
  quizzes: "quizzes",
  flashcards: "flashcards",
  "academic-events": "events",
};

/** OAuth MCP tokens are only accepted by academic APIs, never account/security APIs. */
export function oauthRequestPermission(
  request: Request,
): { resource: string; action: string } | null {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  if (parts[0] !== "api") return null;
  const resource = apiResources[parts[1]];
  if (!resource) return null;
  const action =
    request.method === "DELETE" ||
    parts.some((part) => ["delete", "bulk-delete", "archive"].includes(part))
      ? "delete"
      : ["GET", "HEAD", "OPTIONS"].includes(request.method)
        ? "read"
        : "write";
  return { resource, action };
}
