/**
 * MCP Utility Functions
 *
 * Shared utilities for MCP server operations including logging,
 * error handling, and data formatting.
 *
 * @module mcp/utils
 */

/**
 * MCP request log entry
 */
export interface MCPRequestLog {
  event: string;
  tool?: string;
  userId?: string;
  apiKeyId?: string;
  timestamp: string;
  success?: boolean;
  error?: string;
  params?: unknown;
}

/**
 * Logger for MCP requests
 *
 * Logs are written to console in development and should be
 * sent to a logging service in production.
 *
 * @param log - Log entry to record
 */
export async function logMCPRequest(log: MCPRequestLog): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    const sensitiveKeys = new Set([
      "password",
      "token",
      "authorization",
      "ssn",
      "apiKey",
      "api_key",
      "secret",
      "secretKey",
      "privateKey",
      "accessKey",
      "creditCard",
      "credit_card",
      "ssn",
      "socialSecurityNumber",
    ]);

    const sanitized = { ...log };

    if (log.params && typeof log.params === "object" && log.params !== null) {
      sanitized.params = {};

      for (const [key, value] of Object.entries(
        log.params as Record<string, unknown>,
      )) {
        if (sensitiveKeys.has(key.toLowerCase())) {
          (sanitized.params as Record<string, unknown>)[key] = "[REDACTED]";
        } else {
          (sanitized.params as Record<string, unknown>)[key] = value;
        }
      }
    }

    console.log(JSON.stringify(sanitized));
  } else {
    // In development, log to console
    console.log("[MCP]", JSON.stringify(log, null, 2));
  }
}

/**
 * Format error response for MCP tool
 *
 * @param error - Error object or string
 * @returns Formatted error object
 */
export function formatMCPError(error: unknown): {
  content: Array<{ type: string; text: string }>;
  isError: boolean;
} {
  const message = error instanceof Error ? error.message : String(error);

  return {
    content: [
      {
        type: "text",
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
}

/**
 * Format success response for MCP tool
 *
 * @param data - Data to return
 * @returns Formatted success object
 */
export function formatMCPSuccess(data: unknown): {
  content: Array<{ type: string; text: string }>;
} {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Safely parse JSON with error handling
 *
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Truncate text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Convert database timestamp to ISO string
 *
 * @param date - Date object or string
 * @returns ISO formatted date string
 */
export function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Extract error message from API response error value
 *
 * @param errorValue - Error value from API response (can be string or object)
 * @param fallback - Fallback message if extraction fails
 * @returns Error message string
 */
export function extractErrorMessage(
  errorValue: unknown,
  fallback = "Unknown API error",
): string {
  if (typeof errorValue === "string") {
    return errorValue;
  }
  if (
    errorValue &&
    typeof errorValue === "object" &&
    "message" in errorValue &&
    typeof errorValue.message === "string"
  ) {
    return errorValue.message;
  }
  return fallback;
}

/**
 * Extract user ID from context
 *
 * @param context - MCP server context
 * @returns User ID or null
 */
export function getUserIdFromContext(context: any): string | null {
  return context?.user?.userId || null;
}

/**
 * Check if user is admin
 *
 * @param context - MCP server context
 * @returns True if user is admin
 */
export function isAdminUser(_context: any): boolean {
  const user = _context?.user || _context?.currentUser || _context?.auth;

  if (!user) {
    return false;
  }

  const role = user.role || user.roles;

  if (typeof role === "string") {
    return role === "admin" || role === "mcp_admin";
  }

  if (Array.isArray(role)) {
    return role.includes("admin") || role.includes("mcp_admin");
  }

  return false;
}

type AsyncFactory<T> = () => Promise<T>;

export async function withArrayReduceAll<T>(
  promiseFactories: AsyncFactory<T>[],
): Promise<T[]> {
  const accPromise = promiseFactories.reduce<Promise<T[]>>(
    (acc, factory) =>
      acc.then((results) =>
        factory().then((response) => [...results, response]),
      ),
    Promise.resolve([]),
  );

  return accPromise;
}

type SettledResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

export async function withArrayReduceSettled<T>(
  promiseFactories: Array<() => Promise<T>>,
): Promise<SettledResult<T>[]> {
  return promiseFactories.reduce<Promise<SettledResult<T>[]>>(
    async (acc, factory) => {
      const results = await acc;
      try {
        const data = await factory();
        return [...results, { success: true, data }];
      } catch (error) {
        return [...results, { success: false, error }];
      }
    },
    Promise.resolve([]),
  );
}

export type ApiResponse<U> = {
  data?: {
    success: boolean;
    data?: U;
  };
  error?: {
    value?: {
      message?: string;
    };
  };
};

export type BulkSuccessResult<U> = {
  index: number;
  success: true;
  data: U;
};

export type BulkFailureResult = {
  index: number;
  success: false;
  error: string;
};

export type BulkOperationItemResult<U> =
  | BulkSuccessResult<U>
  | BulkFailureResult;

export type BulkOperationResult<U> = {
  success: boolean;
  results: BulkOperationItemResult<U>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
};

export async function bulkOperation<T>(
  items: T[],
  promiseFactory: (item: T, index: number) => Promise<unknown>,
  onError: "continue" | "abort" = "continue",
): Promise<BulkOperationResult<T>> {
  let successful = 0;
  let failed = 0;

  const factories: Array<() => Promise<BulkOperationItemResult<T>>> = items.map(
    (item, index) => async () => {
      try {
        await promiseFactory(item, index);
        successful++;

        return {
          index,
          success: true,
          data: item,
        };
      } catch (err) {
        failed++;

        const error = err instanceof Error ? err.message : "Unknown error";

        const result: BulkFailureResult = {
          index,
          success: false,
          error,
        };

        if (onError === "abort") {
          throw result;
        }

        return result;
      }
    },
  );

  let results: BulkOperationItemResult<T>[];

  try {
    results = await withArrayReduceAll(factories);
  } catch (err) {
    // Abort path – preserve the failure that caused it
    results =
      err && typeof err === "object" && "index" in err
        ? [err as BulkFailureResult]
        : [];
  }

  return {
    success: failed === 0 || onError === "continue",
    results,
    summary: {
      total: items.length,
      successful,
      failed,
    },
  };
}
