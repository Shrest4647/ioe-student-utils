# Codebase Concerns

**Analysis Date:** 2026-02-20

## Tech Debt

**Social Account Unlink Not Implemented:**
- Issue: Social account unlinking functionality shows info toast but doesn't implement actual unlink
- Files: `src/components/settings/social-accounts-section.tsx:54`
- Impact: Users cannot disconnect social accounts after linking
- Fix approach: Implement `better-auth.unlink` API call and remove placeholder logic

**TypeScript `any` Types:**
- Issue: Extensive use of `any` types throughout components reduces type safety
- Files: `src/hooks/use-mindmap-data.ts`, `src/hooks/use-topic-details.ts`, `src/components/gpa-converter/gpa-converter.tsx`, `src/components/course-explorer/*.tsx`, `src/components/resources/*.tsx`, `src/components/programs/*.tsx`, `src/components/resume-builder/*.tsx`
- Impact: Runtime errors not caught at compile time, reduced IDE support
- Fix approach: Define proper TypeScript interfaces for all data structures

**Resume Template Duplication:**
- Issue: 18 resume template files (9 HTML + 9 PDF) with significant code duplication
- Files: `src/components/resume-builder/templates/*.tsx` (9 files), `src/components/resume-builder/pdf/templates/*.tsx` (9 files)
- Impact: Maintenance burden - changes must be replicated across templates
- Fix approach: Extract common components into shared modules, create base template with composition

**Large MCP Tool Files:**
- Issue: MCP server tools exceed 1000 lines with mixed concerns
- Files: `src/server/mcp/tools/scholarships.ts` (1451 lines), `src/server/mcp/tools/academic.ts` (1274 lines), `src/server/mcp/tools/resources.ts` (1195 lines), `src/server/mcp/tools/colleges.ts` (1173 lines), `src/server/mcp/tools/course-explorer.ts` (1110 lines)
- Impact: Difficult to understand, test, and modify
- Fix approach: Split into smaller, focused modules by feature

**Console-based Error Logging:**
- Issue: Errors logged via `console.error` without structured logging framework
- Files: Multiple files across `src/components/`, `src/app/`
- Impact: No centralized error tracking, difficult debugging in production
- Fix approach: Implement proper error handling service with log levels, integrate error tracking (Sentry, etc.)

## Known Bugs

**Social Account Disconnect Button Non-functional:**
- Symptoms: Clicking "Disconnect" shows toast "Unlinking is not yet implemented"
- Files: `src/components/settings/social-accounts-section.tsx:54-66`
- Trigger: User tries to unlink GitHub, GitLab, or LinkedIn account
- Workaround: None - users remain permanently linked

**Early Return Patterns May Skip Valid Cases:**
- Symptoms: Multiple `return null` statements without comprehensive validation
- Files: `src/components/ui/chart.tsx:78,133,153,168,269`, `src/components/flashcard/FlashcardFullscreen.tsx:113`, `src/components/calendar/full-calendar.tsx:276,317,380,493,607`
- Trigger: Missing or invalid data
- Workaround: None - components silently render nothing

## Security Considerations

**dangerouslySetInnerHTML Usage:**
- Risk: XSS vulnerability if user data is inserted without sanitization
- Files: `src/components/ui/chart.tsx:83`
- Current mitigation: Limited to chart style injection (controlled by app code)
- Recommendations: Audit all chart data for user input, consider CSS-in-JS alternative

**API Key Management JSON Parsing:**
- Risk: JSON.parse on database fields without schema validation
- Files: `src/server/elysia/routes/api-keys.ts:11-18` (parseJSONFields helper)
- Current mitigation: Try-catch returns null on parse failure
- Recommendations: Validate JSON structure with Zod before parsing, add database constraints

**Rate Limiting Not Persistent:**
- Risk: Rate limits reset on server restart (in-memory Map storage)
- Files: `src/server/middleware/rate-limit.ts:9` (rateLimitStore)
- Current mitigation: None
- Recommendations: Use Redis or database-backed storage for production

**Authorization Code Duplication:**
- Risk: Duplicate API key validation logic increases chance of bugs
- Files: `src/server/elysia/plugins/authorization.ts:43-90` (auth macro), `src/server/elysia/plugins/authorization.ts:91-129` (apiKey macro), `src/server/elysia/plugins/authorization.ts:142-197` (role macro)
- Current mitigation: None
- Recommendations: Extract shared validation logic into helper functions

## Performance Bottlenecks

**Study Planner Missing Memoization:**
- Problem: Study planner components don't use useMemo or useCallback despite complex calculations
- Files: `src/components/study-planner/` (0 useMemo/useCallback found)
- Cause: Unnecessary re-renders and recalculations on state updates
- Improvement path: Add useMemo for computed data, useCallback for event handlers

**Large Calendar Component:**
- Problem: 1015-line calendar component renders entire month/week/day views
- Files: `src/components/calendar/full-calendar.tsx` (1015 lines)
- Cause: Monolithic component with all view logic
- Improvement path: Split into separate view components (MonthView, WeekView, DayView), use virtualization for large event lists

**GPA Converter Guide Component Size:**
- Problem: 1351-line static guide component loaded on every page visit
- Files: `src/components/gpa-converter/gpa-converter-guide.tsx`
- Cause: Large static content component
- Improvement path: Move to MDX file or separate page, implement lazy loading

**MCP Server Tools Complexity:**
- Problem: Large tool files with complex nested logic slow down MCP server initialization
- Files: `src/server/mcp/tools/*.ts` (all >1100 lines)
- Cause: Too many tools registered in single files
- Improvement path: Split tools by domain (scholarships.ts, academic.ts → tools/scholarships/*.ts, tools/academic/*.ts)

## Fragile Areas

**MCP Server Error Handling:**
- Files: `src/server/mcp/tools/` (217 error throws across all tools)
- Why fragile: Extensive error handling logic scattered across tools, inconsistent error messages
- Safe modification: Add integration tests covering error scenarios, standardize error response format
- Test coverage: No test coverage for MCP tools (test/integration/mcp/ exists but minimal)

**Resume Template Consistency:**
- Files: 18 template files across HTML and PDF versions
- Why fragile: Template divergence likely - bug fixes must be replicated across all templates
- Safe modification: Create comprehensive test suite with expected output for each template
- Test coverage: No automated template tests, only manual review

**Schema JSON Fields:**
- Files: `src/server/db/schema.ts:118-119` (apikey.permissions, apikey.metadata)
- Why fragile: Runtime JSON parsing without schema constraints
- Safe modification: Add database-level JSONB constraints with CHECK constraints or triggers
- Test coverage: No tests for malformed JSON handling

**Authorization Plugin Complexity:**
- Files: `src/server/elysia/plugins/authorization.ts` (312 lines)
- Why fragile: Multiple authorization macros with duplicated logic, complex state management
- Safe modification: Add unit tests for each auth path (session, API key, admin, owner)
- Test coverage: No dedicated auth tests, covered indirectly by route tests

**Database Schema Migration Reliance:**
- Files: `drizzle/` directory with 25+ migrations
- Why fragile: Schema changes require manual migration execution, no automated rollback
- Safe modification: Always test migrations on copy of production data, add migration rollback scripts
- Test coverage: Migration tests exist (test/integration/) but may not cover edge cases

## Scaling Limits

**Rate Limiting Storage:**
- Current capacity: Limited to available RAM (Map<string, RateLimitStore>)
- Limit: Server memory exhaustion under high concurrent load (10,000+ users)
- Scaling path: Migrate to Redis with distributed rate limiting, implement sliding window algorithm

**MCP Server In-Memory Tool Registration:**
- Current capacity: All MCP tools loaded into memory on startup
- Limit: Tool count limited by Node.js heap size (~50-100 complex tools before GC pressure)
- Scaling path: Implement lazy tool loading, split MCP server into microservices by domain

**Database Query Performance:**
- Current capacity: Single PostgreSQL instance
- Limit: Connection pool exhaustion (default pool ~20 connections), slow queries on large tables (scholarships, courses)
- Scaling path: Add database indexes on frequently filtered columns, implement read replicas for reporting queries, add connection pooling (PgBouncer)

**S3 Presigned URL Expiration:**
- Current capacity: 1-hour presigned URL expiration
- Limit: URLs expire unexpectedly for long-running uploads, requires client refresh
- Scaling path: Extend presigned URL expiration to 24 hours, implement URL refresh on client

## Dependencies at Risk

**Drizzle ORM v1 Beta:**
- Risk: Beta version may have breaking changes, incomplete documentation, potential bugs
- Impact: Database operations could fail, schema migrations may break
- Files: `package.json:50` (drizzle-orm@^1.0.0-beta.8-734e789)
- Migration plan: Pin to stable release when available, add migration test suite

**Elysia Framework:**
- Risk: Rapidly changing API, relatively young project
- Impact: Plugins may break on version upgrades, breaking changes in middleware
- Files: `package.json:51` (elysia@^1.4.19)
- Migration plan: Stay on minor versions within 1.x, monitor changelog for breaking changes

**Next.js 16 (App Router):**
- Risk: App Router still evolving, caching behaviors change
- Impact: Route caching may behave unexpectedly, streaming features may break
- Files: `package.json:61` (next@^16.1.6)
- Migration plan: Test all routes after minor upgrades, review release notes for caching changes

**React 19:**
- Risk: New features like Server Components still maturing
- Impact: Component hydration issues, Server Action failures
- Files: `package.json:65` (react@^19.2.4)
- Migration plan: Use Client Components cautiously, test hydration across browsers

## Missing Critical Features

**Error Boundaries:**
- Problem: No React Error Boundaries to catch component errors
- Blocks: Graceful error handling for component failures
- Impact: Component errors crash entire page, poor user experience

**Centralized Logging:**
- Problem: No structured logging framework, only console.error
- Blocks: Error tracking, debugging, analytics, alerting
- Impact: Production errors invisible, debugging difficult

**Comprehensive Test Coverage:**
- Problem: Only 10 test files found, 0 test coverage for resume builder, MCP tools, calendar
- Blocks: Confidence in refactoring, regression prevention
- Impact: Bugs introduced by changes not caught until production

**File Upload Validation:**
- Problem: No visible file size limits or content type validation in upload routes
- Blocks: Preventing malicious uploads, storage quota management
- Impact: Potential for storage abuse, security vulnerabilities

**Input Sanitization:**
- Problem: No centralized input sanitization for user-generated content
- Blocks: XSS prevention, SQL injection protection
- Impact: Security vulnerabilities in forms and API endpoints

## Test Coverage Gaps

**Resume Builder:**
- What's not tested: All 18 template components, PDF generation, form submissions
- Files: `src/components/resume-builder/**/*.tsx`, `src/components/resume-builder/forms/*.tsx`
- Risk: Template rendering bugs, PDF generation failures, data loss
- Priority: High

**MCP Server Tools:**
- What's not tested: All 5000+ lines of MCP tool registration and handlers
- Files: `src/server/mcp/tools/*.ts`
- Risk: Tool registration failures, incorrect API responses, authentication bugs
- Priority: High

**Calendar Component:**
- What's not tested: Full calendar component, event rendering, view switching, date navigation
- Files: `src/components/calendar/full-calendar.tsx`
- Risk: Rendering bugs, incorrect date calculations, event display issues
- Priority: Medium

**Authorization Plugin:**
- What's not tested: All authorization macros (auth, apiKey, sessionAuth, role, ownerOnly, adminOrOwner, apiKeyOwnerOnly)
- Files: `src/server/elysia/plugins/authorization.ts`
- Risk: Authorization bypass, incorrect permission checks, session validation issues
- Priority: High

**API Routes:**
- What's not tested: Most Elysia routes (universities, colleges, programs, resources, ratings, resumes, gpa-converter)
- Files: `src/server/elysia/routes/*.ts`
- Risk: API regressions, data validation failures, performance issues
- Priority: Medium

**Form Validation:**
- What's not tested: All form components across resume builder, recommendations, study planner
- Files: `src/components/**/forms/*.tsx`, `src/components/**/wizard/*.tsx`
- Risk: Invalid data submission, validation bugs, user experience issues
- Priority: Medium

---

*Concerns audit: 2026-02-20*
