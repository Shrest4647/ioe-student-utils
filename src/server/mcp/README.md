# MCP Server Module

Model Context Protocol (MCP) server implementation for IOESU application.

## Overview

This module provides AI agents with programmatic access to IOESU data through the Model Context Protocol. It exposes tools, resources, and prompts that allow LLMs to query and manipulate scholarships, universities, events, and other content.

## Quick Start

### 1. Create API Key

Generate an API key through the IOESU admin dashboard:

```bash
# API keys are created in the UI at /dashboard/api-keys
```

Default permissions for new keys:
- `scholarships: read, write`
- `universities: read`
- `resources: read, write`

### 2. Connect AI Agent

Configure your AI client (Claude Desktop, Cursor, etc.) to use the MCP server.

**Endpoint**: `https://your-domain.com/api/mcp/sse`

**Required Headers**:
```
Authorization: Bearer YOUR_API_KEY
# OR
x-api-key: YOUR_API_KEY
```

### 3. Use Tools

Invoke tools through your AI agent:

```json
{
  "method": "fetch_scholarships",
  "arguments": {
    "limit": 10,
    "search": "DAAD"
  }
}
```

## File Structure

```
src/lib/mcp/
├── server.ts              # MCP server initialization and configuration
├── auth.ts                 # API key authentication and permission checking
├── utils.ts                # Shared utilities (logging, formatting)
└── tools/                  # Tool implementations by domain
    ├── scholarships.ts      # Scholarship management tools
    ├── universities.ts      # University management tools (future)
    ├── events.ts           # Event management tools (future)
    └── resources.ts        # Resource management tools (future)

src/app/api/mcp/
└── [transport]/
    └── route.ts         # Next.js route handler for MCP endpoint
```

## Architecture

### Server Initialization

```typescript
// src/lib/mcp/server.ts
import { createMcpHandler } from "mcp-handler";

export const handler = createMcpHandler(
  // Register tools
  async (server) => {
    registerScholarshipTools(server);
    // Register more tools...
  },
  // Server options
  {},
  // Configuration
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
    onEvent: (event) => {
      // Log events...
    },
  }
);
```

### Tool Registration

```typescript
// src/lib/mcp/tools/scholarships.ts
import { z } from "zod";

export function registerScholarshipTools(server: any): void {
  server.registerTool(
    "tool_name",
    {
      title: "Tool Title",
      description: "Tool description...",
      inputSchema: z.object({
        param1: z.string().describe("Parameter"),
      }),
    },
    async (params: any) => {
      // Tool implementation
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    }
  );
}
```

### Authentication Flow

```typescript
// src/lib/mcp/auth.ts
export async function authenticateMCPRequest(
  request: Request
): Promise<AuthResult> {
  // Extract API key
  const apiKey = extractApiKey(request);
  
  // Verify with Better Auth
  const result = await auth.api.verifyApiKey({
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  // Return user info
  return {
    valid: true,
    userId: result.key.userId,
    permissions: parsePermissions(result.key.permissions),
  };
}
```

## Standards

### Tool Development

1. **Input Validation**
   - Use Zod schemas for all parameters
   - Add `.describe()` for each parameter
   - Set sensible defaults

2. **Error Handling**
   - Catch and log all errors
   - Return user-friendly error messages
   - Use consistent error format

3. **Response Format**
   - Return `{ content: [...] }` for success
   - Add `isError: true` for failures
   - Include pagination metadata when applicable

4. **Permissions**
   - Define required permissions in `TOOL_PERMISSIONS`
   - Check permissions before execution
   - Document permission requirements

5. **Documentation**
   - Add detailed tool description
   - Include parameter descriptions
   - Provide usage examples
   - Update `docs/mcp-server.md`

### Code Style

- Use TypeScript strict mode
- Follow existing code conventions
- Add JSDoc comments for public functions
- Use descriptive variable names
- Keep functions focused and single-purpose

## Adding New Tools

1. Create tool module in appropriate domain file
2. Define tool registration function
3. Register tool in `src/lib/mcp/server.ts`
4. Add permission to `src/lib/mcp/auth.ts`
5. Update documentation
6. Test with MCP Inspector

### Tool Template

```typescript
import { z } from "zod";
import { db } from "@/server/db";
import { yourTable } from "@/server/db/schema";

/**
 * Register new domain tools
 */
export function registerNewDomainTools(server: any): void {
  server.registerTool(
    "tool_name",
    {
      title: "Tool Title",
      description: `
        Clear description of what this tool does.
        Include usage instructions and examples.
      `.trim(),
      inputSchema: z.object({
        // Define parameters with Zod
        param1: z
          .string()
          .min(1)
          .max(100)
          .describe("Parameter description"),
        param2: z
          .number()
          .optional()
          .describe("Optional parameter"),
      }),
    },
    async (params: any, requestContext: any) => {
      try {
        // Get user info from context
        const userId = requestContext?.auth?.userId;
        
        // Permission check
        if (!hasPermission(userPermissions, "resource", "action")) {
          throw new Error("Insufficient permissions");
        }
        
        // Database operation
        const result = await db
          .select()
          .from(yourTable)
          .where(eq(yourTable.id, params.id))
          .limit(1);
        
        // Return result
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: result,
              }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : "Failed",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from "bun:test";
import { fetchScholarshipsTool } from "./scholarships";

describe("MCP: fetch_scholarships", () => {
  it("should return scholarships", async () => {
    const result = await fetchScholarshipsTool({ limit: 10 });
    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing

Use MCP Inspector to test tools interactively:

```bash
bun add @modelcontextprotocol/inspector
bun x mcp-inspector --url http://localhost:3000/api/mcp/sse \
  --header "Authorization: Bearer TEST_API_KEY"
```

## Security Considerations

### SQL Injection Prevention
- Use Drizzle ORM for all queries
- Never concatenate raw SQL
- Validate all inputs with Zod schemas

### Authorization
- Always check user permissions before executing tools
- Use `requestContext.auth` to access user info
- Implement resource ownership checks when needed

### Rate Limiting
- Rely on Better Auth's built-in rate limiting
- Respect the rate limits enforced by API keys

### Audit Logging
- Log all tool invocations
- Include user ID, tool name, and timestamp
- Log errors with full context
- Enable verbose logs in development

## Performance

### Database Optimization
- Use proper indexes on query fields
- Implement pagination for large result sets
- Consider caching for frequently accessed data
- Use selective field queries

### Response Size
- Limit result sets with pagination
- Truncate long text fields
- Stream large responses if needed
- Compress responses when appropriate

## Deployment

### Production Configuration

```bash
# Set production environment
NODE_ENV=production

# Ensure MCP endpoint is accessible
# Configure CORS if needed
# Set appropriate rate limits
```

### Monitoring

Monitor:
- Tool invocation frequency
- Response times
- Error rates
- API key usage patterns

## Troubleshooting

### Common Issues

**Tools not showing in client**
- Check server is running
- Verify MCP endpoint is accessible
- Check client configuration

**Permission errors**
- Verify API key permissions
- Check permission definitions in `auth.ts`
- Ensure user has required role

**Database errors**
- Check database connection
- Verify table names and columns
- Review query conditions

**Timeouts**
- Increase `maxDuration` in `server.ts`
- Optimize slow queries
- Check for blocking operations

## Related Documentation

- [MCP Server Documentation](./docs/mcp-server.md)
- [Better Auth API Keys](./docs/better-auth-api-key.md)
- [Drizzle ORM](./docs/drizzle.md)

## Support

For issues or questions:
- Check main project README
- Review existing tool implementations for patterns
- Consult MCP specification documentation
