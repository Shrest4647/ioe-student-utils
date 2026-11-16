# Connecting external AI apps

Use `https://ioesu.sunilshrestha.com/api/mcp/mcp` as the MCP server URL.
The server uses Streamable HTTP, OAuth authorization codes, and S256 PKCE.
API keys remain available for clients that support bearer headers.

## Deployment configuration

Set `NEXT_PUBLIC_BASE_URL` to the public, canonical application origin, without a
trailing slash. For production this is `https://ioesu.sunilshrestha.com`.
An explicit value takes precedence over `VERCEL_URL`, so discovery and token
requests use the same host and sign-in cookies. The auth provider also uses this
base URL. No database migration is required by this change.

The root OAuth metadata advertises only implemented endpoints. The installed
Better Auth 1.4 MCP plugin does not implement the userinfo and JWKS endpoints its
built-in metadata advertises, so those URLs are omitted from our public metadata.
This server advertises OAuth discovery, not OpenID Connect discovery.

Public discovery URLs:

- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/api/mcp/mcp`

The MCP 401 response points to root resource metadata using the canonical public
origin. Browser clients can read the `WWW-Authenticate` header. Preflight requests
do not require credentials. The REST catch-all exports OPTIONS, and cross-origin
OAuth token and dynamic registration requests are allowed without opening the
rest of the API to arbitrary origins.

## Manual setup, including Gemini

1. Open the assistant's MCP connection dialog and paste the MCP server URL.
2. If it asks for a client ID and secret, copy its redirect URI.
3. Open **Dashboard → AI app connections**, choose **Register app**, and paste that
   exact redirect URI. HTTPS callbacks are required, except HTTP loopback URLs for
   local development. One callback is supported per manually registered client.
4. Copy the generated client ID and secret into the assistant. Secrets are only
   returned when created or rotated. Existing secrets remain compatible.
5. Continue to sign-in, review the named app and return host, then approve access.

Clients supporting dynamic registration can register public or confidential
clients themselves. Public clients use PKCE with no client secret. Confidential
clients can authenticate with HTTP Basic or a form-encoded client secret.

A registered client is not proof of a successful connection. OAuth connections start with read-only academic access. During approval,
administrators can select **Allow creating and editing academic entries**. The
server then adds `mcp:write` to that grant, even if the client only requested
identity scopes. Requesting `mcp:write` alone does not grant editing: the signed-in
administrator must select the checkbox. Delete tools and account/security APIs
remain excluded. Old tokens stay read-only, including after refresh; reconnect
the assistant to approve editing. Current account roles are checked on every
request, so losing the admin role also removes delegated writing.

Both MCP and downstream academic REST endpoints verify the same OAuth token,
expiry, active client, current user, and consented permissions. The REST API also
keeps its existing route-level role checks. A 401 means the credential could not
be verified. A 403 with `insufficient_scope` means the connection lacks permission.

Agents may also submit diagnostic feedback; see [agent feedback](mcp-agent-feedback.md) for storage, privacy, and review access.
Use separately scoped API keys for content management. A secret rotation changes
future confidential token requests, but existing access tokens remain valid until
expiry. Revoke a manually registered app to delete its associated tokens and
consents through database foreign-key cascades. Automatically registered clients
without an owner are currently visible to administrators, not in each user's
registered-app list.

## Provider guards

The installed provider skips consent unless requested explicitly and does not
validate confidential client secrets on refresh. Our hooks require consent,
verify the approving session owns the request, authenticate refresh clients,
and remove the old token pair after successful refresh. Sequential reuse of an
old refresh token fails. Rotation is not an atomic transaction across concurrent
refresh requests in this provider; clients should serialize refreshes.

## Validation and troubleshooting

`test/mcp-oauth-flow.test.ts` uses the real installed Better Auth provider with an
in-memory adapter. It needs no database, environment files, or external accounts.
It checks confidential and public clients, form-encoded exchanges, cross-origin
requests, consent ownership, code replay, refresh authentication and rotation,
and callback validation.

Run it with:

```sh
bun --no-env-file test test/mcp-oauth-flow.test.ts
```

After deployment, check the three discovery URLs return JSON without login or
hosting-protection redirects, and that an unauthenticated MCP request returns
401 with the correct `resource_metadata` URL. Remove a failed assistant connection
and retry, since the assistant may have cached the previous metadata. If the
provider requires S256 PKCE, clients omitting it will be rejected.

An actual Gemini connection must still be verified against the deployed public
hostname. Local provider tests cannot confirm Google's discovery cache, account
eligibility, or callback behavior.
