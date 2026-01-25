# MCP Server for IOESU Application

## Overview

The Model Context Protocol (MCP) server enables AI agents to interact with the IOESU application programmatically. AI assistants like Claude Desktop, Cursor, and other tools can use these MCP tools to query, create, and update website data.

## Features

- **Tool-based API**: Exposes domain-specific tools for scholarship, university, event, and resource management
- **Type-safe validation**: All tools use Zod schemas for input validation
- **Permission-based access**: Tools respect API key permissions
- **Real-time logging**: Track all tool invocations for audit trails
- **SSE Transport**: Server-Sent Events for real-time communication
- **Vercel Integration**: Built on Vercel's mcp-handler for Next.js

## Available Tools

### Scholarship Tools

| Tool Name | Description | Required Permissions |
|------------|-------------|---------------------|
| `fetch_scholarships` | Retrieve scholarships with filtering and pagination | `scholarships: read` |

#### fetch_scholarships

Retrieves scholarships from the IOESU database with optional filtering.

**Parameters:**

- `limit` (number, optional, default: 20): Maximum results to return (1-100)
- `offset` (number, optional, default: 0): Pagination offset
- `search` (string, optional): Search term for name/description matching
- `countryCodes` (array of strings, optional): Filter by ISO country codes (e.g., ["US", "UK"])
- `fieldIds` (array of strings, optional): Filter by field of study IDs
- `degreeIds` (array of strings, optional): Filter by degree level IDs
- `fundingType` (enum, optional): Filter by funding type (`fully_funded`, `partial`, `tuition_only`)
- `status` (enum, optional): Filter by status (`active`, `inactive`, `archived`)
- `isActive` (boolean, optional): Filter by active status
- `includeInactive` (boolean, optional, default: false): Include inactive results

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string",
      "providerName": "string",
      "websiteUrl": "string",
      "fundingType": "fully_funded" | "partial" | "tuition_only",
      "status": "active" | "inactive" | "archived",
      "isActive": boolean,
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    }
  ],
  "pagination": {
    "limit": number,
    "offset": number,
    "total": number
  },
  "filters": {
    "search": "string",
    "countryCodes": ["string"],
    "fieldIds": ["string"],
    "degreeIds": ["string"],
    "fundingType": "enum",
    "status": "enum",
    "isActive": boolean
  }
}
```

## Authentication

All MCP requests require a valid API key. API keys are created in the IOESU admin panel with specific permissions.

### API Key Headers

Include API key in one of these headers:

```
Authorization: Bearer ik_1234567890abcdef
# OR
x-api-key: ik_1234567890abcdef
```

### Default Permissions

New API keys created by IOESU have these default permissions:

```json
{
  "scholarships": ["read", "write"],
  "universities": ["read"],
  "colleges": ["read"],
  "departments": ["read"],
  "programs": ["read"],
  "courses": ["read"],
  "resources": ["read", "write"],
  "recommendations": ["read", "write"],
  "resumes": ["read", "write"],
  "ratings": ["read"]
}
```

## Connecting to MCP Server

### Claude Desktop Configuration

Add to Claude Desktop configuration (`~/.claude/config.json` or Claude Desktop settings):

```json
{
  "mcpServers": {
    "ioesu": {
      "command": "node",
      "args": [
        "-e",
        "require('http').createServer((req, res) => { const handler = require('./src/lib/mcp/server').handler; return handler(req).then(res); }).listen(3001)"
      ]
    }
  }
}
```

### Using with curl

Test the MCP endpoint directly:

```bash
curl -X POST http://localhost:3000/api/mcp/sse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Tool Invocation Example

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "fetch_scholarships",
    "arguments": {
      "limit": 10,
      "search": "DAAD"
    }
  }
}
```

## Development

### Local Development

```bash
# Start the development server
bun dev

# Test MCP endpoint
curl http://localhost:3000/api/mcp/sse
```

### Testing with MCP Inspector

```bash
# Install MCP Inspector
bun add @modelcontextprotocol/inspector

# Run inspector with API key
bun x mcp-inspector --url http://localhost:3000/api/mcp/sse --header "Authorization: Bearer YOUR_API_KEY"
```

### Debugging

Enable verbose logs by setting `NODE_ENV=development`:

```bash
NODE_ENV=development bun dev
```

Logs will show:
- Tool invocations
- Request parameters
- Response status
- Error details

## Security

### Permission System

Tools require specific permissions:

| Tool | Required Permission | Description |
|------|-------------------|-------------|
| `fetch_scholarships` | `scholarships: read` | Read scholarship data |
| `create_scholarship` | `scholarships: write` | Create new scholarships |
| `update_scholarship` | `scholarships: write` | Modify scholarships |
| `delete_scholarship` | `scholarships: delete` | Delete scholarships |

### Rate Limiting

All API keys have rate limiting enforced by Better Auth:
- Default: 1000 requests per day
- Configurable per API key
- Automatic throttling when exceeded

### Audit Logging

All tool invocations are logged with:
- Timestamp
- API key ID
- Tool name
- Parameters (in development)
- Success/failure status

## Extending the MCP Server

### Adding New Tools

1. Create tool module in `src/lib/mcp/tools/`:
   ```typescript
   // src/lib/mcp/tools/new-domain.ts
   import { z } from "zod";
   import { db } from "@/server/db";
   import { yourTable } from "@/server/db/schema";

   export function registerNewDomainTools(server: any): void {
     server.registerTool(
       "tool_name",
       {
         title: "Tool Title",
         description: "Tool description...",
         inputSchema: z.object({
           param1: z.string().describe("Parameter description"),
         }),
       },
       async (params: any) => {
         // Implementation here
         const result = await db.select().from(yourTable);
         
         return {
           content: [{ type: "text", text: JSON.stringify(result) }],
         };
       }
     );
   }
   ```

2. Register tools in `src/lib/mcp/server.ts`:
   ```typescript
   import { registerNewDomainTools } from "./tools/new-domain";

   async (server) => {
     registerScholarshipTools(server);
     registerNewDomainTools(server); // Add here
   }
   ```

3. Update permissions in `src/lib/mcp/auth.ts`:
   ```typescript
   export const TOOL_PERMISSIONS = {
     // ... existing
     tool_name: { resource: "resource_type", action: "read/write/delete" },
   } as const;
   ```

4. Update this documentation with new tool details

### Tool Development Checklist

- [ ] Define input schema with Zod
- [ ] Add detailed description
- [ ] Implement database queries
- [ ] Handle errors gracefully
- [ ] Return consistent response format
- [ ] Add permission check
- [ ] Write documentation
- [ ] Test with MCP Inspector
- [ ] Add usage examples

## Architecture

```
src/
├── app/
│   └── api/
│       └── mcp/
│           └── [transport]/
│               └── route.ts       # Next.js route handler
└── lib/
    └── mcp/
        ├── server.ts               # MCP server configuration
        ├── auth.ts                 # Authentication & permissions
        ├── utils.ts                # Utility functions
        └── tools/                  # Tool implementations
            ├── scholarships.ts      # Scholarship tools (POC)
            ├── universities.ts      # University tools (future)
            ├── events.ts           # Event tools (future)
            └── resources.ts        # Resource tools (future)
```

## Troubleshooting

### Common Issues

**Issue**: "Unauthorized: Invalid or missing API key"
- **Solution**: Ensure API key is included in `Authorization: Bearer <key>` or `x-api-key: <key>` header
- Verify API key is not expired
- Check API key has required permissions

**Issue**: "Insufficient permissions. Requires 'scholarships: read' permission"
- **Solution**: Regenerate API key with required permissions or contact administrator
- Check permissions in `src/server/better-auth/config.ts` under apiKey plugin

**Issue**: Tool execution timeout
- **Solution**: Check if tool query is slow, consider optimizing database query
- Increase `maxDuration` in `src/lib/mcp/server.ts`

**Issue**: Connection refused on SSE endpoint
- **Solution**: Ensure development server is running: `bun dev`
- Check CORS settings if connecting from different origin

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Vercel MCP Handler](https://github.com/vercel/mcp-handler)
- [Better Auth Documentation](https://www.better-auth.com/docs/plugins/api-key)
- [Zod Documentation](https://zod.dev/)

## License

Part of IOESU application. See main project LICENSE file.
