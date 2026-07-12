# Testing Workflow

Use [`ci-test.sh`](/home/tknsunil/github/ioe-student-utils/ci-test.sh) as the canonical test entrypoint.

## Test Tiers

1. Unit tests (default)
- Fast, lightweight, no external service dependency required.
- Runs all `test/*.test.ts` except:
  - `test/integration/**`
  - `test/mcp-auth.test.ts`

2. Integration tests (`-I`)
- Runs non-MCP integration tests under `test/integration/**` except `test/integration/mcp/**`.
- Intended for tests that may depend on DB/server integrations.

3. MCP tests (`-M`)
- Runs:
  - `test/mcp-auth.test.ts`
  - `test/integration/mcp/*.test.ts`
- Intended for MCP endpoint/auth transport validation.

## Commands

```bash
# Typecheck + unit tests
./ci-test.sh

# Typecheck + unit + integration (non-MCP)
./ci-test.sh -I

# Typecheck + unit + MCP tests
./ci-test.sh -M

# Typecheck + unit + integration + MCP
./ci-test.sh -I -M
```

## MCP Environment Variables

When `-M` is used, script resolves MCP env in this order:

1. `TEST_MCP_URL`, `TEST_MCP_API_KEY` (recommended for CI secrets)
2. `MCP_URL`, `MCP_API_KEY`
3. Fallbacks:
- `MCP_URL=http://localhost:3000/api/mcp/mcp`
- `MCP_API_KEY=YOUR_API_KEY_HERE`

For authenticated MCP runs, set:

```bash
export TEST_MCP_URL="http://localhost:3000/api/mcp/mcp"
export TEST_MCP_API_KEY="<real-api-key>"
./ci-test.sh -M
```

## CI Recommendation

1. Pull request gate:
- `./ci-test.sh`

2. Extended pre-merge/nightly gate:
- `./ci-test.sh -I -M`

## Cycle 1 Covered Domains

- `programs` routes (public listing/details + admin auth behavior + legacy compatibility path)
- `departments` routes (public list/details/relations + admin auth behavior + slug collision handling)
- `universities` routes (public list/details + admin auth behavior + slug collision handling)
- Rate limiting middleware behavior (public tier + strict mutation/admin tier)

## Route-Risk Test Matrix (Required for New Route Tests)

For each high-risk route group, include:

1. Success path
- Valid request returns expected response envelope and core data.

2. Validation path
- Invalid body/query/params fail predictably with 4xx behavior.

3. Not-found path
- Lookup endpoints return not-found behavior consistently.

4. Authorization path
- Unauthenticated blocked on protected routes.
- Non-admin blocked on admin routes.
- Admin succeeds on admin routes.

5. Pagination/filter path
- Metadata and filtered data remain consistent.

6. Rate-limit path (public/protected as applicable)
- Headers present.
- Threshold enforcement returns 429 with standard error payload.

## Security Policy Notes

- Public read routes must be rate-limited.
- Admin mutation routes must enforce role-based authorization.
- Compatibility-first hardening: keep stable route contracts while tightening correctness/security behavior.
