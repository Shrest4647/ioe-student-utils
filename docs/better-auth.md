# Better Auth + Next.js + Elysia: Comprehensive LLM AI Agent Integration Guide

**A Self-Contained Reference for Building Authentication Systems with LLM AI Agent Support**

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Server-Side Setup](#server-side-setup)
4. [Next.js Integration](#nextjs-integration)
5. [Elysia Integration](#elysia-integration)
6. [Client Implementation](#client-implementation)
7. [Authentication Methods](#authentication-methods)
8. [Session Management](#session-management)
9. [Plugin System & Extensions](#plugin-system--extensions)
10. [OpenAPI & LLM Agent Discovery](#openapi--llm-agent-discovery)
11. [Database Configuration](#database-configuration)
12. [Deployment Considerations](#deployment-considerations)
13. [LLM Agent Patterns](#llm-agent-patterns)
14. [Quick Reference & API Patterns](#quick-reference--api-patterns)

---

## Architecture Overview

Better Auth is a **framework-agnostic TypeScript authentication framework** designed for modern full-stack applications. It provides:

- **Type-safe authentication** with full TypeScript support
- **Multiple authentication strategies** (email/password, OAuth, passkeys, magic links, 2FA)
- **Flexible database adapters** (Prisma, Drizzle, MongoDB, PostgreSQL, MySQL, SQLite)
- **Plugin ecosystem** for extending functionality
- **REST API** auto-generated and OpenAPI-documented
- **Stateless & cookie-based sessions** with flexible caching strategies

### Core Components

| Component            | Purpose                                                                   | Location                               |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| **Auth Server**      | Core authentication logic, database operations, API endpoints             | Backend (Next.js API routes or Elysia) |
| **Database Adapter** | Manages data persistence (users, sessions, accounts)                      | Your database                          |
| **Auth Client**      | Browser-side SDK for authentication flows                                 | Frontend (React, Vue, vanilla JS)      |
| **Plugins**          | Extend authentication capabilities (2FA, magic links, OAuth, roles, etc.) | Backend + optional frontend            |
| **OpenAPI Plugin**   | Auto-generates API documentation for agent discovery                      | Backend                                |

### Key Concepts for LLM Agents

1. **REST API First**: All functionality exposed through HTTP endpoints, discoverable via OpenAPI
2. **Token-Based Auth**: Bearer tokens (JWT, custom) for agent access
3. **Session Independence**: Stateless session support for agent scenarios
4. **Type Safety**: TypeScript enables code generation for agents
5. **Plugin Extensibility**: Custom endpoints for agent-specific needs

---

## Project Structure

### Standard Layout

```
project-root/
├── src/
│   ├── lib/
│   │   ├── auth.ts              # Server auth instance
│   │   ├── auth-client.ts       # Client auth instance
│   │   └── db/
│   │       ├── client.ts        # DB connection
│   │       └── schema.ts        # Drizzle/Prisma schema
│   ├── app/
│   │   ├── api/auth/[...all]/
│   │   │   └── route.ts         # Next.js catch-all handler
│   │   └── pages/               # Protected pages
│   ├── elysia/                  # (if using Elysia)
│   │   ├── server.ts            # Elysia instance
│   │   └── index.ts             # Entry point
│   └── middleware.ts            # Next.js middleware (optional)
├── .env.local                   # Secrets
├── .env.example                 # Template
└── package.json
```

---

## Server-Side Setup

### Installation

```bash
bun add better-auth
bun add @better-auth/[adapter] # e.g., drizzle, prisma
bun add drizzle-orm dotenv
```

### 1. Environment Variables

```env
# .env.local
BETTER_AUTH_SECRET=your-generated-secret-key # Run: npx better-auth secret
DATABASE_URL=postgresql://user:pass@localhost/dbname
AUTH_TRUST_HOST=http://localhost:3000
```

### 2. Database Adapter Setup (Drizzle Example)

**src/lib/db/schema.ts**

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**src/lib/db/client.ts**

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### 3. Server Auth Instance

**src/lib/auth.ts**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { db } from "./db/client";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.AUTH_TRUST_HOST,
  trustedOrigins: [process.env.AUTH_TRUST_HOST!],

  // Core authentication methods
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  // Session configuration
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update on use after 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Plugins
  plugins: [
    openAPI({
      path: "/api/auth/reference",
    }),
    // Add other plugins as needed
  ],

  // Hooks for custom logic
  hooks: {
    before: {
      async signInEmail({ request, context }) {
        // Custom validation, logging, etc.
        return null; // Continue normally
      },
    },
    after: {
      async signUpEmail({ user, session }) {
        // Send welcome email, trigger events, etc.
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

---

## Next.js Integration

### API Route Handler

**src/app/api/auth/[...all]/route.ts** (App Router)

```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { POST, GET } = toNextJsHandler(auth);
```

**pages/api/auth/[...all].ts** (Pages Router)

```typescript
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

export default toNodeHandler(auth);
```

### Session Protection Middleware

**Next.js 16+ (Proxy Pattern)**

```typescript
// proxy.ts
import { getSessionCookie } from "better-auth/next-js";

export function proxy(request: Request) {
  const pathname = new URL(request.url).pathname;

  // Get session from cookie cache (fast)
  const session = getSessionCookie(request.headers);

  // Protect routes
  if (pathname.startsWith("/dashboard") && !session) {
    return Response.redirect(new URL("/auth/signin", request.url));
  }

  return null; // Continue to Next.js
}
```

**Next.js 15.1 and below (Middleware)**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("auth.session");

  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (isProtectedRoute && !sessionCookie?.value) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

### Server-Side Session Access

**Using Server Actions**

```typescript
// lib/auth-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getCurrentSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}
```

**Using React Server Components**

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Client-Side Hook Usage

```typescript
// components/auth-status.tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function AuthStatus() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Authenticated as: {session.user.email}</p>
    </div>
  );
}
```

---

## Elysia Integration

### Server Setup

**src/elysia/server.ts**

```typescript
import Elysia from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth";

export const createAuthApp = () => {
  return new Elysia({ name: "auth-server" })
    .use(
      cors({
        credentials: true,
        origin: process.env.AUTH_TRUST_HOST,
      })
    )
    .mount(auth.handler);
};

// Mount Better Auth at /api/auth
export const setupAuthRoutes = (app: Elysia) => {
  return app.mount(auth.handler);
};
```

### Route with Session Context

```typescript
// src/elysia/routes.ts
import Elysia from "elysia";
import { auth } from "@/lib/auth";

export const createProtectedRoutes = () => {
  const app = new Elysia({ name: "protected-routes" }).macro({
    auth: {
      resolve: async ({ request: { headers } }) => {
        const session = await auth.api.getSession({ headers });
        return { session };
      },
    },
  });

  // Protected endpoint - macro provides session automatically
  app.get(
    "/api/profile",
    async ({ auth: { session }, set }) => {
      if (!session) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      return { user: session.user };
    },
    { auth: true }
  );

  // Public endpoint
  app.get("/api/public", () => {
    return { message: "This is public" };
  });

  return app;
};
```

### Full Server Example

```typescript
// src/elysia/index.ts
import Elysia from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@/lib/auth";

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      origin: process.env.ELYSIA_CORS_ORIGIN || "http://localhost:3000",
    })
  )
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        return { session };
      },
    },
  })
  .get("/api/health", () => ({ status: "ok" }))
  .get(
    "/api/user",
    async ({ auth: { session }, set }) => {
      if (!session) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      return { user: session.user };
    },
    { auth: true }
  )
  .listen(process.env.ELYSIA_PORT || 3001);

console.log(`🦊 Server is running at ${app.server?.url}`);
```

---

## Client Implementation

### Client Instance

**src/lib/auth-client.ts**

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
});

// Type inference
export type Session = typeof authClient.$Infer.Session;
```

### Sign Up Component

```typescript
"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp}>
      <input name="name" type="text" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
```

### Session Hook

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserGreeting() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session?.user) return <div>Not logged in</div>;

  return <h1>Welcome, {session.user.name}!</h1>;
}
```

### Sign Out

```typescript
"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  }

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

---

## Authentication Methods

### Email & Password (Built-in)

```typescript
// Server: Already enabled in auth.ts configuration

// Client sign up
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "securepass123",
  name: "John Doe",
});

// Client sign in
const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "securepass123",
});
```

### OAuth Providers

**Server Configuration**

```typescript
// src/lib/auth.ts (add to auth instance)
export const auth = betterAuth({
  // ... existing config

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  account: {
    accountLinking: {
      enabled: true, // Allow linking email + OAuth
    },
  },
});
```

**Client Usage**

```typescript
"use client";

import { authClient } from "@/lib/auth-client";

export function OAuthButtons() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleGithubLogin = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    });
  };

  return (
    <>
      <button onClick={handleGoogleLogin}>Sign in with Google</button>
      <button onClick={handleGithubLogin}>Sign in with GitHub</button>
    </>
  );
}
```

**Supported Providers**
Google, GitHub, Apple, Discord, Microsoft, LinkedIn, Facebook, Twitch, Spotify, Twitter/X, Reddit, Kakao, LINE, Naver, VK, Zoom, and 30+ more. See: https://www.better-auth.com/docs/authentication/google

---

## Session Management

### Core Session Structure

```typescript
interface Session {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: User;
}
```

### Session Configuration

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  // ... other config

  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Refresh after 1 day of use

    // Cookie cache for performance
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      // Strategies: 'compact' (default) | 'jwt' | 'jwe'
    },
  },
});
```

### Session Cache Strategies

| Strategy  | Size     | Security         | Use Case                                 |
| --------- | -------- | ---------------- | ---------------------------------------- |
| `compact` | Smallest | Good (signed)    | Performance-critical, internal use       |
| `jwt`     | Medium   | Good (signed)    | JWT compatibility, external integrations |
| `jwe`     | Largest  | Best (encrypted) | Maximum security, sensitive data         |

### Getting Session

**Client-side Hook**

```typescript
const { data: session } = useSession();
```

**Server-side (Next.js)**

```typescript
const session = await auth.api.getSession({ headers: headersInstance });
```

**Server-side (Elysia)**

```typescript
const session = await auth.api.getSession({ headers });
```

### Multi-Session Support

```typescript
// List all user sessions
const sessions = await auth.api.listSessions({ headers });

// Revoke specific session
await auth.api.revokeSession({
  headers,
  body: { token: sessionToken },
});

// Revoke all other sessions
await auth.api.revokeOtherSessions({ headers });

// Revoke all sessions
await auth.api.revokeSessions({ headers });
```

---

## Plugin System & Extensions

### Built-in Plugins Reference

| Plugin              | Purpose                          | Docs                         |
| ------------------- | -------------------------------- | ---------------------------- |
| **Two-Factor Auth** | Add 2FA with TOTP                | `/docs/plugins/2fa`          |
| **Magic Link**      | Passwordless email login         | `/docs/plugins/magic-link`   |
| **Email OTP**       | Email one-time passcode          | `/docs/plugins/email-otp`    |
| **Passkey**         | WebAuthn passkey support         | `/docs/plugins/passkey`      |
| **Organization**    | Multi-tenant organizations/teams | `/docs/plugins/organization` |
| **OAuth Proxy**     | Proxy OAuth flows                | `/docs/plugins/oauth-proxy`  |
| **JWT**             | JWT token authentication         | `/docs/plugins/jwt`          |
| **API Key**         | API key management               | `/docs/plugins/api-key`      |
| **Admin**           | Admin panel & user management    | `/docs/plugins/admin`        |
| **SSO**             | Single Sign-On configuration     | `/docs/plugins/sso`          |
| **OpenAPI**         | Auto-generated API docs          | `/docs/plugins/open-api`     |
| **Stripe**          | Stripe subscription integration  | `/docs/plugins/stripe`       |

Full plugin list: https://www.better-auth.com/docs/plugins

### Creating Custom Plugins

**Server Plugin**

```typescript
// lib/plugins/custom-plugin.ts
import { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth";

export const customPlugin = (): BetterAuthPlugin => ({
  id: "custom-plugin",

  endpoints: {
    sendNotification: createAuthEndpoint(
      "/custom/send-notification",
      {
        method: "POST",
      },
      async (req, ctx) => {
        // ctx includes auth context: db, options, session, etc.
        const { userId, message } = await req.json();

        // Your custom logic
        console.log(`Sending to ${userId}: ${message}`);

        return { success: true };
      }
    ),
  },

  hooks: {
    after: {
      async signUpEmail({ user }) {
        // Send welcome notification
        console.log(`New user: ${user.email}`);
      },
    },
  },

  schema: {
    notification: {
      fields: {
        userId: {
          type: "string",
          required: true,
          references: {
            model: "user",
            field: "id",
          },
        },
        message: {
          type: "string",
          required: true,
        },
        sentAt: {
          type: "date",
          required: false,
        },
      },
    },
  },
});
```

**Client Plugin**

```typescript
// lib/plugins/custom-plugin-client.ts
import { BetterAuthClientPlugin } from "better-auth/client";

export const customPlugin = (): BetterAuthClientPlugin => ({
  id: "custom-plugin",
  $InferServerPlugin: {} as ReturnType<typeof customPlugin>,

  getActions: (fetch) => ({
    sendNotification: async (data: { userId: string; message: string }) => {
      return fetch("/custom/send-notification", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  }),
});
```

**Using in Auth Instance**

```typescript
// src/lib/auth.ts
import { customPlugin } from "./plugins/custom-plugin";

export const auth = betterAuth({
  // ... other config
  plugins: [customPlugin()],
});

// On client
await authClient.sendNotification({
  userId: "user123",
  message: "Hello!",
});
```

---

## OpenAPI & LLM Agent Discovery

### Enabling OpenAPI Documentation

**Add Plugin to Auth Instance**

```typescript
// src/lib/auth.ts
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  // ... config
  plugins: [
    openAPI({
      path: "/api/auth/reference",
      theme: "default",
    }),
  ],
});
```

### Accessing OpenAPI Schema

**Via Browser**

- Navigate to: `http://localhost:3000/api/auth/reference` (Next.js)
- Navigate to: `http://localhost:3001/api/auth/reference` (Elysia)

**Programmatically**

```typescript
// Get full OpenAPI schema
const schema = await auth.api.generateOpenAPISchema();
console.log(JSON.stringify(schema, null, 2));

// Use in agent discovery
const endpoints = schema.paths;
// Agents can now discover all available endpoints
```

**Schema Structure**

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Better Auth API",
    "version": "1.0.0"
  },
  "paths": {
    "/sign-in/email": {
      "post": {
        "tags": ["Default"],
        "summary": "Sign in with email and password"
      }
    },
    "/sign-up/email": {
      "post": {
        "tags": ["Default"],
        "summary": "Sign up with email and password"
      }
    },
    "/get-session": {
      "get": {
        "tags": ["Default"],
        "summary": "Get current session"
      }
    }
  },
  "components": {
    "schemas": {
      "User": { ... },
      "Session": { ... }
    }
  }
}
```

### LLM Agent Integration

**Node.js Agent Example**

```typescript
// agent.ts
import fetch from "node-fetch";

class AuthAgent {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async discoverEndpoints() {
    const schema = await fetch(`${this.baseUrl}/api/auth`).then((r) =>
      r.json()
    );
    return schema;
  }

  async signUp(email: string, password: string, name: string) {
    const res = await fetch(`${this.baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    this.token = data.session?.token;
    return data;
  }

  async getSession() {
    const res = await fetch(`${this.baseUrl}/api/auth/get-session`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return res.json();
  }

  async signOut() {
    await fetch(`${this.baseUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    this.token = undefined;
  }
}

// Usage
const agent = new AuthAgent("http://localhost:3000");
await agent.signUp("bot@example.com", "secure123", "AI Agent");
const session = await agent.getSession();
```

---

## Database Configuration

### Supported Databases

```typescript
// Drizzle ORM
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Prisma
import { prismaAdapter } from "better-auth/adapters/prisma";

// Native Kysely (for Postgres, MySQL, SQLite)
import { betterAuth } from "better-auth";

// MongoDB
import { mongoAdapter } from "better-auth/adapters/mongo";
```

### Extending User Schema

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  // ... other config

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false, // User cannot set during signup
        defaultValue: "user",
      },
      tier: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});

// Hook to set role
export const auth = betterAuth({
  // ... config
  hooks: {
    after: {
      async signUpEmail({ user, context }) {
        // Set default role on signup
        await context.internalAdapter.updateUser(user.id, {
          role: "user",
          tier: "free",
        });
      },
    },
  },
});
```

### Database Hooks

```typescript
export const auth = betterAuth({
  // ... config
  user: {
    hooks: {
      before: {
        async create({ user }) {
          // Validate email domain
          if (!user.email.endsWith("@company.com")) {
            throw new Error("Only company emails allowed");
          }
          return user;
        },
      },
      after: {
        async create({ user }) {
          // Send welcome email
          console.log(`Welcome ${user.email}!`);
        },
      },
    },
  },
});
```

### Custom ID Generation

```typescript
// UUID generation
export const auth = betterAuth({
  advanced: {
    database: {
      generateId: "uuid", // or 'serial' for auto-increment
    },
  },
});

// Custom function
import { v4 as uuid } from "uuid";

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: (model) => {
        if (model === "user") return uuid();
        return uuid(); // or custom logic
      },
    },
  },
});
```

---

## Deployment Considerations

### Environment Variables

```env
# Production
BETTER_AUTH_SECRET=<generate with: npx better-auth secret>
DATABASE_URL=postgresql://user:pass@prod-db:5432/auth
AUTH_TRUST_HOST=https://app.example.com
NEXT_PUBLIC_AUTH_URL=https://app.example.com
NODE_ENV=production

# Email (for password resets, verification)
RESEND_API_KEY=<resend_key>
# or
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth Providers
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate `BETTER_AUTH_SECRET`** periodically
3. **Enable email verification** for sign-ups
4. **Implement rate limiting** on auth endpoints
5. **Use 2FA** for sensitive operations
6. **Monitor session activity** for suspicious patterns
7. **Implement CORS carefully** - trust only your domains
8. **Store tokens securely** in HTTP-only cookies (default)
9. **Implement audit logging** for auth events
10. **Keep dependencies updated**

### Vercel Deployment

```json
{
  "env": {
    "BETTER_AUTH_SECRET": "@better_auth_secret",
    "DATABASE_URL": "@database_url",
    "AUTH_TRUST_HOST": "https://yourapp.vercel.app"
  }
}
```

### Docker Setup

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## LLM Agent Patterns

### 1. Stateless Agent Authentication

LLM agents typically operate statelessly, obtaining tokens for each request:

```typescript
// Agent pattern: Get token, make request, discard token
class LLMAuthAgent {
  async authenticateOnce(email: string, password: string) {
    // Get fresh session token
    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { session } = await response.json();
    return session.token; // Short-lived token
  }

  async makeAuthenticatedRequest(token: string, endpoint: string, data?: any) {
    return fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
```

### 2. API Key Pattern (with JWT Plugin)

```typescript
// Enable JWT plugin for persistent API keys
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      jwksUrl: "https://your-app.com/.well-known/jwks.json",
    }),
  ],
});

// Agent uses long-lived JWT token
const token = await auth.api.generateToken({
  userId: "agent-user-id",
  expiresIn: 30 * 24 * 60 * 60, // 30 days
});
```

### 3. Tool Discovery Pattern

```typescript
// Agent discovers available endpoints
class SmartAuthAgent {
  async discoverAndInvoke(toolName: string, params: any) {
    // Fetch OpenAPI schema
    const schema = await fetch("/api/auth/reference/openapi.json").then((r) =>
      r.json()
    );

    // Find endpoint matching tool name
    const endpoint = Object.entries(schema.paths).find(([path]) =>
      path.includes(toolName)
    );

    if (!endpoint) throw new Error(`Tool ${toolName} not found`);

    // Invoke with parameters
    const [path, methods] = endpoint;
    const method = Object.keys(methods)[0]; // POST or GET

    return fetch(path, {
      method: method.toUpperCase(),
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }).then((r) => r.json());
  }
}
```

### 4. Custom Agent Endpoints

Create dedicated endpoints for agents:

```typescript
// lib/plugins/agent-plugin.ts
import { BetterAuthPlugin, createAuthEndpoint } from "better-auth";

export const agentPlugin = (): BetterAuthPlugin => ({
  id: "agent-plugin",

  endpoints: {
    // Get available agent tools
    "agent/tools": createAuthEndpoint(
      "/agent/tools",
      { method: "GET" },
      async (req, ctx) => {
        const session = await ctx.auth.api.getSession({
          headers: ctx.headers,
        });

        if (!session) {
          throw new Error("Unauthorized");
        }

        return {
          tools: [
            {
              id: "user-profile",
              name: "Get User Profile",
              description: "Retrieve authenticated user profile",
              method: "GET",
              endpoint: "/api/user/profile",
            },
            {
              id: "user-update",
              name: "Update User Profile",
              description: "Update user profile information",
              method: "POST",
              endpoint: "/api/user/profile",
            },
          ],
        };
      }
    ),

    // Execute agent action
    "agent/execute": createAuthEndpoint(
      "/agent/execute",
      { method: "POST" },
      async (req, ctx) => {
        const session = await ctx.auth.api.getSession({
          headers: ctx.headers,
        });

        if (!session) {
          throw new Error("Unauthorized");
        }

        const { toolId, params } = await req.json();

        // Route to appropriate handler
        switch (toolId) {
          case "user-profile":
            return { profile: session.user };
          case "user-update":
            // Update user
            return { updated: true };
          default:
            throw new Error(`Unknown tool: ${toolId}`);
        }
      }
    ),
  },
});
```

---

## Quick Reference & API Patterns

### Server-Side API (auth.api.\*)

```typescript
// Session
await auth.api.getSession({ headers });
await auth.api.listSessions({ headers });
await auth.api.revokeSession({ headers, body: { token } });
await auth.api.revokeOtherSessions({ headers });
await auth.api.revokeSessions({ headers });

// Authentication
await auth.api.signUpEmail({ body: { email, password, name } });
await auth.api.signInEmail({ body: { email, password } });
await auth.api.signOut({ headers });

// User Management
await auth.api.updateUser({ headers, body: { name, image } });
await auth.api.changePassword({
  headers,
  body: { newPassword, currentPassword },
});
await auth.api.changeEmail({ headers, body: { newEmail } });

// Verification
await auth.api.verifyEmail({ body: { code } });
await auth.api.forgotPassword({ body: { email } });
await auth.api.resetPassword({ body: { token, password } });
```

### Client-Side API (authClient.\*)

```typescript
// Authentication
await authClient.signUp.email({ email, password, name });
await authClient.signIn.email({ email, password });
await authClient.signOut();
await authClient.signIn.social({ provider: "google", callbackURL });

// Session
const { data: session } = useSession();
const { data: session } = authClient.getSession();

// User
const { data: user } = authClient.getUser();
await authClient.updateUser({ name, image });
await authClient.changePassword({ newPassword, currentPassword });
await authClient.changeEmail({ newEmail });

// OAuth
await authClient.linkAccount({ provider: "github" });
await authClient.unlinkAccount({ provider: "github" });
```

### HTTP Endpoint Patterns

```
POST   /api/auth/sign-up/email           # Email sign up
POST   /api/auth/sign-in/email           # Email sign in
GET    /api/auth/get-session             # Get current session
POST   /api/auth/sign-out                # Sign out
POST   /api/auth/change-password         # Change password
POST   /api/auth/forgot-password         # Forgot password
POST   /api/auth/reset-password          # Reset password
POST   /api/auth/send-verification-email # Send verification email
POST   /api/auth/verify-email            # Verify email
POST   /api/auth/change-email            # Change email
GET    /api/auth/list-sessions           # List user sessions
POST   /api/auth/revoke-session          # Revoke specific session
POST   /api/auth/revoke-other-sessions   # Revoke all other sessions
POST   /api/auth/revoke-sessions         # Revoke all sessions
POST   /api/auth/sign-in/social          # Sign in with OAuth
GET    /api/auth/oauth/authorize         # OAuth authorize (redirects)
GET    /api/auth/oauth/callback/:provider # OAuth callback
POST   /api/auth/link-account            # Link OAuth account
DELETE /api/auth/link-account/:provider  # Unlink OAuth account

# OpenAPI & Documentation
GET    /api/auth/reference               # OpenAPI Scalar UI
GET    /api/auth/reference/openapi.json  # OpenAPI schema
```

### Error Handling Pattern

```typescript
const { data, error } = await authClient.signIn.email({
  email,
  password,
});

if (error) {
  switch (error.status) {
    case 401:
      console.log("Invalid credentials");
      break;
    case 404:
      console.log("User not found");
      break;
    case 429:
      console.log("Too many attempts, try again later");
      break;
    default:
      console.log(error.message);
  }
}
```

### Type Inference Pattern

```typescript
// Infer session type from auth instance
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;

// Use in components
function Component() {
  const { data: session } = useSession();
  // session is properly typed as Session | null

  if (session?.user.role === "admin") {
    // Safe to access custom fields
  }
}
```

---

## Resources & Links

**Official Documentation**

- Introduction: https://www.better-auth.com/docs/introduction
- Installation: https://www.better-auth.com/docs/installation
- Basic Usage: https://www.better-auth.com/docs/basic-usage
- Concepts: https://www.better-auth.com/docs/concepts/api

**Framework Integrations**

- Next.js: https://www.better-auth.com/docs/integrations/next
- Elysia: https://www.better-auth.com/docs/integrations/elysia
- Express: https://www.better-auth.com/docs/integrations/express
- NestJS: https://www.better-auth.com/docs/integrations/nestjs
- Remix: https://www.better-auth.com/docs/integrations/remix
- SvelteKit: https://www.better-auth.com/docs/integrations/svelte-kit

**Databases**

- Database Adapters: https://www.better-auth.com/docs/adapters/prisma
- PostgreSQL: https://www.better-auth.com/docs/adapters/postgresql
- MySQL: https://www.better-auth.com/docs/adapters/mysql
- MongoDB: https://www.better-auth.com/docs/adapters/mongo

**Authentication Methods**

- OAuth Providers: https://www.better-auth.com/docs/authentication/google
- Email & Password: https://www.better-auth.com/docs/authentication/email-password
- Magic Link: https://www.better-auth.com/docs/plugins/magic-link
- Passkeys: https://www.better-auth.com/docs/plugins/passkey
- 2FA: https://www.better-auth.com/docs/plugins/2fa

**Advanced Topics**

- Plugin Development: https://www.better-auth.com/docs/guides/your-first-plugin
- Session Management: https://www.better-auth.com/docs/concepts/session-management
- OpenAPI: https://www.better-auth.com/docs/plugins/open-api
- Database Hooks: https://www.better-auth.com/docs/concepts/database#database-hooks

**GitHub Repository**

- https://github.com/better-auth/better-auth

---

**This guide is self-contained and covers production-ready implementation patterns for Next.js + Elysia with Better Auth, specifically optimized for LLM AI agent integration. For the latest updates and API changes, consult the official Better Auth documentation.**
