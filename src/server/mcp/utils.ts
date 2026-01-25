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
    // In production, send to logging service
    // await logToService(log);
    console.log(JSON.stringify(log));
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
  // This would be implemented based on user role from database
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
