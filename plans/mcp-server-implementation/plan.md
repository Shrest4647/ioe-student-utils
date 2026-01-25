# MCP Server Implementation Plan

## Overview

Implementation of a Model Context Protocol (MCP) server for the IOESU application to enable AI agents to manage website data and content programmatically. The MCP server will expose tools, resources, and prompts that allow AI agents to perform CRUD operations on scholarships, universities, events, and other content entities.

### Primary Use Cases

- **Scholarship Management**: Add, update, remove scholarships and their associated data
- **University Data**: Insert new universities, update existing information
- **Event Management**: Create and manage scholarship round events and deadlines
- **Resource Library**: Upload and categorize educational resources
- **Search & Discovery**: AI-assisted search for scholarships, universities, and opportunities
- **Data Quality**: Validate and clean up existing data

### Target Audience

- AI coding assistants (Claude Desktop, Cursor, Windsurf)
- Custom AI agents for automated content management
- Admin users managing large-scale data updates
- Integration with external AI-powered services

---

## Technical Approach

### Technology Selection

**Option 1: Next.js Built-in MCP (Recommended for this project)**
- Next.js 16 includes native MCP endpoint at `/_next/mcp`
- Integrates seamlessly with existing Elysia API routes
- Use `next-devtools-mcp` package for development
- Vercel's MCP Adapter for production deployment

**Option 2: Elysia MCP Plugin**
- `elysia-mcp` plugin by kerlos (GitHub)
- HTTP transport with streaming support
- Type-safe with Zod validation
- Good fit for Elysia architecture

**Decision**: Use **Next.js Built-in MCP** because:
1. Native integration with Next.js 16
2. Can coexist with existing Elysia API routes
3. Better documentation and community support
4. Leverages existing authentication system (Better Auth + API Keys)
5. Future-proof with Vercel's continued investment

---

## Implementation Plan

### Phase 1: MCP Server Foundation

#### 1.1 Installation & Configuration

```bash
bun add @modelcontextprotocol/sdk @vercel/mcp-adapter
bun add -d next-devtools-mcp
```

#### 1.2 MCP Server Setup

Create `/src/lib/mcp/server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { APIRoute } from 'astro';

export const mcpServer = new Server(
  {
    name: 'ioesu-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Tool handlers will be registered here
```

#### 1.3 Next.js Integration

Create `/src/app/api/mcp/route.ts`:

```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { mcpServer } from '@/lib/mcp/server';
import { verifyApiKey } from '@/lib/auth-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // API Key authentication
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const verification = await verifyApiKey({ key: apiKey });
  if (!verification.valid) {
    return new Response('Unauthorized', { status: 401 });
  }

  // SSE transport
  const transport = new SSEServerTransport('/api/mcp', request);
  await mcpServer.connect(transport);

  return new Response('MCP Server Connected', {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### Phase 2: MCP Tools Implementation

#### 2.1 Scholarship Management Tools

**Tool: `create_scholarship`**
- Create new scholarship with metadata
- Link to countries, fields, and degrees
- Create initial scholarship round
- Supports funding types and provider information

**Tool: `update_scholarship`**
- Update scholarship details
- Manage active/inactive status
- Update deadlines and amounts
- Link/unlink countries, fields, degrees

**Tool: `delete_scholarship`**
- Soft delete (archive) scholarships
- Cascade to related rounds and applications
- Maintain audit trail

**Tool: `search_scholarships`**
- Query scholarships by filters
- Full-text search on name and description
- Filter by country, field, degree level, funding type
- Sort by deadline, amount, relevance

#### 2.2 University Management Tools

**Tool: `create_university`**
- Add new university with basic info
- Create associated colleges
- Link to countries

**Tool: `update_university`**
- Update university information
- Add/edit colleges
- Manage active status

**Tool: `create_college`**
- Add college to existing university
- Link departments
- Set college type and details

**Tool: `search_universities`**
- Query universities and colleges
- Filter by country, location, type
- Full-text search

#### 2.3 Event & Deadline Management Tools

**Tool: `create_scholarship_round`**
- Create new scholarship round
- Set deadlines and amounts
- Configure active status

**Tool: `create_round_event`**
- Add events to rounds (webinars, interviews, etc.)
- Set event dates and types
- Add descriptions

**Tool: `update_deadlines`**
- Bulk update deadlines
- Set reminder schedules
- Update event dates

#### 2.4 Resource Management Tools

**Tool: `create_resource`**
- Upload resource to S3
- Link to categories and content types
- Set featured status

**Tool: `categorize_resource`**
- Link resource to categories
- Update content type
- Add attachments

**Tool: `search_resources`**
- Query resources by filters
- Full-text search
- Filter by category and type

#### 2.5 Rating System Tools

**Tool: `submit_rating`**
- Add rating for universities/colleges/programs
- Support multiple rating categories
- Include review text

**Tool: `get_ratings`**
- Fetch ratings for entities
- Filter by category, verification status
- Aggregate statistics

#### 2.6 Data Validation & Cleanup Tools

**Tool: `validate_data`**
- Check data integrity
- Identify orphaned records
- Validate relationships
- Report inconsistencies

**Tool: `cleanup_orphans`**
- Remove orphaned records
- Archive outdated data
- Clean up unused entities

**Tool: `bulk_import`**
- Import data from CSV/JSON
- Validate before import
- Rollback on errors
- Support batch operations

### Phase 3: MCP Resources Implementation

#### 3.1 Data Export Resources

**Resource: `scholarships_export`**
- Export all scholarships as JSON
- Include related data (rounds, countries, fields)
- Support filtering before export

**Resource: `universities_export`**
- Export universities and colleges
- Include departments and programs
- Hierarchical structure

**Resource: `analytics_summary`**
- Summary statistics
- Active counts by category
- Deadline distribution
- Trending data

#### 3.2 Schema Resources

**Resource: `database_schema`**
- Current schema definitions
- Entity relationships
- Field types and constraints

**Resource: `mcp_tool_documentation`**
- All available tools with examples
- Parameter definitions
- Response formats

### Phase 4: MCP Prompts Implementation

#### 4.1 Scholarship Analysis Prompts

**Prompt: `analyze_scholarship_fit`**
- Analyze student profile vs scholarship requirements
- Generate fit scores
- Identify missing criteria

**Prompt: `generate_scholarship_description`**
- Create compelling scholarship descriptions
- Follow brand voice
- Include key information

**Prompt: `find_similar_scholarships`**
- Find scholarships similar to reference
- Compare features
- Highlight differences

#### 4.2 Content Generation Prompts

**Prompt: `create_event_description`**
- Generate event descriptions
- Include key details
- Follow style guide

**Prompt: `generate_resource_summary`**
- Summarize educational resources
- Extract key points
- Categorize content

#### 4.3 Data Quality Prompts

**Prompt: `validate_dataset`**
- Check data quality
- Identify issues
- Suggest corrections

**Prompt: `suggest_duplicates`**
- Find potential duplicate records
- Compare similarities
- Flag for review

### Phase 5: Authentication & Authorization

#### 5.1 API Key Integration

```typescript
// Verify API key before processing MCP requests
export async function authenticateMCPRequest(request: Request): Promise<{ valid: boolean; userId?: string; permissions?: Record<string, string[]> }> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return { valid: false };
  }

  const verification = await authClient.apiKey.verify({
    key: apiKey,
  });

  if (!verification.valid || !verification.data) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: verification.data.key.userId,
    permissions: verification.data.key.permissions,
  };
}
```

#### 5.2 Permission-Based Tool Access

```typescript
// Map tools to required permissions
const TOOL_PERMISSIONS = {
  'create_scholarship': ['scholarships', 'write'],
  'update_scholarship': ['scholarships', 'write'],
  'delete_scholarship': ['scholarships', 'delete'],
  'search_scholarships': ['scholarships', 'read'],
  // ... mapping for all tools
};

export function checkToolPermission(toolName: string, userPermissions: Record<string, string[]>): boolean {
  const required = TOOL_PERMISSIONS[toolName];
  if (!required) return true; // Public tools

  const [resource, action] = required;
  const userActions = userPermissions[resource] || [];
  return userActions.includes(action) || userActions.includes('*');
}
```

#### 5.3 Rate Limiting

```typescript
// Apply Better Auth rate limiting to MCP requests
// Each API key already has rate limiting configured
// Monitor usage and enforce limits per tool
```

### Phase 6: Client Integration & Documentation

#### 6.1 Claude Desktop Configuration

Create `.claude_desktop_config.json` example:

```json
{
  "mcpServers": {
    "ioesu": {
      "command": "node",
      "args": ["-e", "require('http').createServer((req, res) => { /* proxy to local MCP server */ }).listen(3001)"],
      "env": {
        "MCP_SERVER_URL": "https://ioesu.com/api/mcp",
        "API_KEY": "sk_live_..."
      }
    }
  }
}
```

#### 6.2 Usage Documentation

Create `/docs/mcp-server.md`:

- Quick start guide
- Authentication setup
- Tool reference with examples
- Resource documentation
- Prompt usage guide
- Best practices
- Error handling

#### 6.3 Example Scripts

Create `/examples/mcp-examples/`:

- `create-scholarship.ts` - Example using MCP to create scholarship
- `batch-import.ts` - Bulk data import script
- `search-and-notify.ts` - Find and notify users
- `data-validation.ts` - Validate dataset integrity

### Phase 7: Monitoring & Logging

#### 7.1 Request Logging

```typescript
// Log all MCP requests with details
import { logger } from '@/lib/logger';

export function logMCPRequest(toolName: string, params: unknown, userId: string, result: unknown) {
  logger.info({
    event: 'mcp_request',
    tool: toolName,
    userId,
    timestamp: new Date().toISOString(),
    success: result !== null,
  });
}
```

#### 7.2 Usage Analytics

- Track tool usage frequency
- Monitor popular operations
- Identify performance bottlenecks
- Generate usage reports

#### 7.3 Error Tracking

```typescript
// Capture MCP errors for monitoring
export function handleMCPError(error: unknown, context: string) {
  logger.error({
    event: 'mcp_error',
    context,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service
}
```

---

## File Structure

```
src/
├── lib/
│   └── mcp/
│       ├── server.ts                 # MCP server instance
│       ├── tools/                   # Tool implementations
│       │   ├── scholarships.ts       # Scholarship tools
│       │   ├── universities.ts       # University tools
│       │   ├── events.ts            # Event tools
│       │   ├── resources.ts         # Resource tools
│       │   ├── ratings.ts           # Rating tools
│       │   ├── data-validation.ts   # Validation tools
│       │   └── index.ts             # Tool registry
│       ├── resources/               # Resource handlers
│       │   ├── exports.ts          # Data exports
│       │   ├── schema.ts            # Schema resources
│       │   └── index.ts
│       ├── prompts/                 # Prompt definitions
│       │   ├── analysis.ts          # Analysis prompts
│       │   ├── generation.ts        # Content generation
│       │   └── index.ts
│       ├── auth.ts                  # MCP authentication
│       ├── permissions.ts           # Permission checking
│       └── utils.ts                # MCP utilities
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts            # MCP endpoint (SSE)
examples/
└── mcp-examples/
    ├── create-scholarship.ts
    ├── batch-import.ts
    ├── search-and-notify.ts
    └── data-validation.ts
docs/
└── mcp-server.md                   # MCP documentation
```

---

## Implementation Order

1. **Phase 1**: Server foundation, authentication setup
2. **Phase 2**: Core CRUD tools (scholarships, universities)
3. **Phase 3**: Advanced tools (events, resources, ratings)
4. **Phase 4**: Resources and prompts implementation
5. **Phase 5**: Permission system refinement
6. **Phase 6**: Documentation and examples
7. **Phase 7**: Monitoring and analytics
8. **Testing**: End-to-end with Claude Desktop
9. **Deployment**: Production MCP endpoint
10. **Iteration**: Add tools based on usage patterns

---

## Security Considerations

### Authentication
- API key authentication required for all MCP requests
- Support Bearer token and x-api-key header
- Session support via `enableSessionForAPIKeys`
- Admin override capabilities

### Authorization
- Permission-based tool access
- Role-based escalation (admin, user)
- Resource ownership validation
- Audit logging for all operations

### Rate Limiting
- Use Better Auth built-in rate limiting
- Per-tool rate limits for expensive operations
- Burst allowances for bulk operations
- Usage monitoring and alerts

### Data Privacy
- Mask sensitive data in logs
- Export data with proper access controls
- Validate user permissions before operations
- GDPR compliance considerations

### Input Validation
- Zod schemas for all tool inputs
- Sanitize markdown content
- Validate file uploads
- Prevent SQL injection via ORM

---

## Testing Strategy

### Unit Tests
- Tool logic validation
- Permission checking
- Input/output validation

### Integration Tests
- MCP endpoint connectivity
- API key authentication
- Tool execution with database

### E2E Tests
- Claude Desktop integration
- Batch operations
- Error scenarios

### Load Tests
- Concurrent tool usage
- Bulk data operations
- Resource export performance

---

## Performance Considerations

### Optimization
- Batch database operations
- Index optimizations for search tools
- Cache frequently accessed resources
- Lazy load related data

### Streaming
- SSE for long-running operations
- Progress callbacks for bulk operations
- Chunked responses for large exports

### Monitoring
- Tool execution time tracking
- Database query optimization
- Memory usage monitoring

---

## Success Metrics

### Adoption
- Number of API keys created for MCP access
- Tool usage frequency by category
- Active AI agent integrations

### Performance
- Average tool response time < 500ms
- 99.9% uptime for MCP endpoint
- Successful operation rate > 99%

### Quality
- Data validation error rate < 1%
- User-reported issues < 5/month
- Security incidents = 0

---

## Future Enhancements

### Advanced Features
- Real-time notifications via webhooks
- Scheduled data updates
- AI-powered data enrichment
- Automatic scholarship discovery
- Predictive analytics

### Integrations
- External scholarship databases
- University APIs
- Social media monitoring
- Email notification system
- Slack/Discord bots

### Tools Expansion
- Email campaign management
- User outreach automation
- Content recommendation engine
- A/B testing framework
- Advanced reporting

---

## Dependencies

### Required Packages
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "@vercel/mcp-adapter": "^1.0.0",
  "next-devtools-mcp": "^1.0.0",
  "zod": "^3.22.0"
}
```

### Already in Project
- Better Auth (with API Key plugin)
- Elysia (for API routes)
- Drizzle ORM (database)
- Shadcn UI (for admin UI)

---

## Known Challenges

### Technical
- SSE transport reliability in serverless environments
- Large data export performance
- Concurrent request handling
- Rate limit enforcement

### Business
- API key management at scale
- User education on MCP usage
- Integration complexity for external parties
- Data quality maintenance

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Set up development environment
- Implement core tools
- Internal testing with team

### Phase 2: Beta Testing (Week 2)
- Limited beta users
- Feedback collection
- Bug fixes and improvements

### Phase 3: Public Launch (Week 3)
- Documentation publication
- Example scripts release
- Marketing and announcements

### Phase 4: Iteration (Ongoing)
- Monitor usage patterns
- Add requested features
- Optimize performance
- Expand tool set

---

## Conclusion

This MCP server implementation will transform the IOESU application into an AI-friendly platform, enabling automated content management, data discovery, and intelligent operations. The modular design allows for incremental expansion while maintaining security and performance standards.

By leveraging the existing Better Auth API Key infrastructure and Next.js 16's MCP support, we can deliver a production-ready solution with minimal technical debt and maximum flexibility for future enhancements.
