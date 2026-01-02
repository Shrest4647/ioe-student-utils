# Elysia.js + Next.js: Comprehensive Guide

This guide provides a comprehensive approach to integrating Elysia as a high-performance, type-safe backend within a Next.js App Router project.

## 🚀 Quick Start

### Project Structure

```
./src/
├─ app/
│   └─ api/
│       └─ [[...slugs]]/
│           └─ route.ts   ← Elysia lives here
├─ server/elysia/
│   └─ index.ts          ← server-side Elysia code
├─ lib/
│   └─ eden.ts            ← client-side Eden treaty
├─ components/            ← React UI
├─ package.json
└─ bunfig.toml           ← Bun config (optional)
```

### Core Integration

To use Elysia inside Next.js, create a catch-all route handler. This allows Elysia to handle all requests sent to `/api/*`.

```typescript
// app/api/[[...slugs]]/route.ts
import { Elysia, t } from "elysia";

/* 1️⃣ Create an Elysia instance (prefix optional) */
const api = new Elysia({ prefix: "/api" })
  .get("/", () => "👋 Hello from Elysia+Next.js")
  .post("/", ({ body }) => body, {
    /* 2️⃣ Validation – runtime + TypeScript safety */
    body: t.Object({
      name: t.String(),
      age: t.Optional(t.Number()),
    }),
  });

/* 3️⃣ Export each HTTP verb that Next.js expects */
export const GET = api.fetch; // ← works for any GET request
export const POST = api.fetch; // ← works for any POST request
export const PUT = api.fetch; // ← works for any PUT request
export const PATCH = api.fetch; // ← works for any PATCH request
export const DELETE = api.fetch; // ← works for any DELETE request

// Export the type for Eden Treaty
export type App = typeof api;
```

_Why this works?_  
Next.js "App Router" treats any exported function named after an HTTP verb as the handler for that route. `api.fetch` is a thin wrapper that converts a standard `Request` into an Elysia call, so the server behaves exactly like a regular Elysia app.

## 🔧 End-to-End Type Safety with Eden

Elysia's superpower is Eden, which provides a TRPC-like experience with zero code generation.

### Client-Side (Browser)

```typescript
// lib/eden.ts – shared client helper
import { edenTreaty } from "@elysiajs/eden";
import { type App } from "@/app/api/[[...slugs]]/route"; // <-- path to server type

export const api = edenTreaty<App>("http://localhost:3000/api");
```

```tsx
// app/page.tsx – use the API from React
import { api } from "@/lib/eden";

export default async function Page() {
  const data = await api.post("/", { body: { name: "Fox", age: 5 } });
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### Server-Side (Server Components)

When calling Elysia from Server Components, use `edenFetch` for a lightweight, typed fetch wrapper.

```typescript
import { edenFetch } from "@elysiajs/eden";
import type { App } from "@/app/api/[[...slugs]]/route";

const fetch = edenFetch<App>("http://localhost:3000/api");

export default async function Page() {
  const { data, error } = await fetch("/user", {
    method: "POST",
    body: { name: "Elysia" },
  });

  return <div>{data?.name}</div>;
}
```

_Result_: The request/response types are inferred from the server's Elysia schema, so you get full IntelliSense and compile‑time safety on both sides.

## 📋 Common Patterns & Best Practices

| Pattern                              | Code snippet                                                           | Why use it                                                                |
| ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Route grouping (prefix)**          | `new Elysia({ prefix: '/users' })`                                     | Keeps URLs tidy and avoids duplication.                                   |
| **Validation with `t` (TypeBox)**    | `body: t.Object({ email: t.String({ format: 'email' }) })`             | Runtime checks + automatic OpenAPI generation.                            |
| **Standard-schema (Zod, Valibot…)**  | `import { z } from 'zod'; params: z.object({ id: z.coerce.number() })` | Plug in your favourite validator without leaving Elysia.                  |
| **Lazy / async plugins**             | `app.use(import('./heavyPlugin'))`                                     | Won't block server start‑up; good for large modules.                      |
| **Static file serving**              | `app.use(staticPlugin({ assets: './public' }))`                        | Serve React's `index.html` or other assets from the same process.         |
| **GraphQL (Apollo or Yoga)**         | `app.use(apollo({ typeDefs, resolvers }))`                             | Add a GraphQL endpoint alongside REST with minimal code.                  |
| **Full‑stack dev server (Bun 1.3+)** | See the "Bun Fullstack Dev Server" example for HMR without Vite        | Great for rapid iteration when you prefer a single repo for front + back. |

## 🔒 Key Elysia Patterns for Next.js

### Validation with TypeBox

Elysia uses TypeBox for high-performance schema validation. Use this to secure your API boundaries.

```typescript
import { t } from "elysia";

const app = new Elysia().post("/login", ({ body }) => login(body), {
  body: t.Object({
    username: t.String(),
    password: t.String({ minLength: 8 }),
  }),
});
```

### Context & State (Plugins)

Use `.derive` or `.state` to inject shared logic (like Database connections or Auth) into your routes.

```typescript
const app = new Elysia()
  .derive(({ request }) => {
    const auth = request.headers.get("Authorization");
    return {
      user: verifyAuth(auth),
    };
  })
  .get("/profile", ({ user }) => user);
```

### Handling CORS

If your Next.js frontend and Elysia backend are on different domains (or ports during dev), use the CORS plugin.

```bash
bun add @elysiajs/cors
```

```typescript
import { cors } from "@elysiajs/cors";

new Elysia().use(cors());
```

## 🛠️ Helpful Commands

```bash
# Install core deps
bun add elysia @elysiajs/eden

# Install optional deps (pick what you need)
bun add @elysiajs/cors @elysiajs/static @elysiajs/graphql-apollo

# Run dev server (Next.js + Bun)
bun dev        # same as `next dev`
```

_Note: All code works with Bun runtime. Replace `bun` with `npm`/`yarn` if you use another package manager._

## 🚀 Deployment

When deploying to Vercel, Elysia works out of the box because it adheres to Web Standard Request/Response. Ensure your catch-all route is configured correctly as shown in Section 1.

## Important Links

- [Integration with Next.js](https://elysiajs.com/integrations/nextjs#integration-with-nextjs)
- [Request](https://elysiajs.com/essential/handler#request)
- [Elysia with BetterAuth](https://elysiajs.com/integrations/better-auth)
- [Validation](https://elysiajs.com/essential/validation#validation)
- [Path priority](https://elysiajs.com/essential/route#path-priority)
- [Lazy Load](https://elysiajs.com/essential/plugin#lazy-load)
- [Schema type](https://elysiajs.com/essential/validation#schema-type)
- [Best Practice](https://elysiajs.com/essential/best-practice#best-practice)
- [Config](https://elysiajs.com/essential/plugin#config)
- [Plugin](https://elysiajs.com/essential/plugin#plugin)
- [Plugin Deduplication](https://elysiajs.com/essential/plugin#plugin-deduplication)
- [Official plugins](https://elysiajs.com/plugins/overview#official-plugins)
- [Community plugins](https://elysiajs.com/plugins/overview#community-plugins)
- [Lifecycle](https://elysiajs.com/essential/life-cycle#lifecycle)
- [Scope](https://elysiajs.com/essential/plugin#scope)

## 🧩 Elysia Patterns & Plugins – Quick Reference for LLMs

| Category                  | Pattern / Plugin                  | Short description                                                                                                            | Docs link                                                            |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Core patterns**         | **Route grouping (prefix)**       | Create a sub‑app with a common URL prefix to keep routes tidy.                                                               | `essential/route#group`                                              |
|                           | **Path priority**                 | Static > dynamic > wildcard. Elysia always matches the most‑specific path first.                                             | `essential/route#path-priority`                                      |
|                           | **Lifecycle hooks**               | `onRequest`, `onAfterHandle`, `onError`, etc. Hook into request processing at defined points.                                | `essential/life-cycle#lifecycle`                                     |
|                           | **Lazy / async plugins**          | Load heavy modules only after the server starts, preventing start‑up blocking.                                               | `essential/plugin#lazy-load`                                         |
|                           | **Plugin deduplication**          | Plugins identified by `name` (and optional `seed`) are registered only once, improving performance.                          | `essential/plugin#plugin-deduplication`                              |
|                           | **Service Locator**               | When a plugin decorates state, other parts of the app can `use` that plugin to gain its type‑safety automatically.           | `essential/plugin#service-locator`                                   |
|                           | **Functional callback plugin**    | Write a plain function `(app) => app…` and pass to `.use`. Behaves like a plugin but merges directly into the main instance. | `essential/plugin#config`                                            |
|                           | **Configurable plugin (factory)** | Plugin factories accept options (e.g., version) and return a new `Elysia` instance. Keeps plugins reusable.                  | `essential/plugin#config`                                            |
| **Validation / Schema**   | **Elysia.t (TypeBox)**            | Inline runtime validation that also generates OpenAPI specs.                                                                 | `patterns/typebox#typebox-elysiat`                                   |
|                           | **Zod / Valibot integration**     | Plug any validator library via `app.validate` or `decorate`.                                                                 | `essential/plugin#validation`                                        |
| **State & Decorators**    | **decorate**                      | Add properties or methods to the context (e.g., `app.decorate('db', new DB())`).                                             | `essential/state#decorate`                                           |
|                           | **state**                         | Store mutable server‑wide data (`app.state('counter', 0)`).                                                                  | `essential/state#state`                                              |
| **Static assets**         | **staticPlugin**                  | Serve files from a folder (`public/`) without extra servers.                                                                 | `plugins/static#static-plugin`                                       |
| **GraphQL**               | **apolloPlugin / yogaPlugin**     | Attach a GraphQL endpoint alongside REST routes.                                                                             | `plugins/graphql-apollo#graphql-apollo-plugin`                       |
| **OpenAPI**               | **swaggerPlugin**                 | Auto‑generate Swagger UI from route definitions.                                                                             | `plugins/swagger#swagger-plugin`                                     |
| **Eden (client)**         | **Eden client**                   | Type‑safe client generated from server schema; use in Next.js pages or API routes.                                           | `essential/eden#introduction`                                        |
| **Testing**               | **app.test**                      | Built‑in test utilities; `await app.modules` waits for lazy plugins.                                                         | `essential/testing#test`                                             |
| **Full‑stack dev server** | **Bun HMR**                       | Run Elysia and Next.js in one Bun process, hot‑reload both.                                                                  | `patterns/fullstack-dev-server#elysia-with-bun-fullstack-dev-server` |

## 📦 Package Installation Guide

### Core Packages

| Category          | Packages (Bun)                                                         | Why you need them                   |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| Core              | `elysia` `@elysiajs/eden`                                              | Server framework + type‑safe client |
| Validation        | `@sinclair/typebox` (or `zod` / `valibot`)                             | Runtime schema & OpenAPI generation |
| Security          | `@elysiajs/bearer` `@elysiajs/cors` `@elysiajs/jwt` `@elysiajs/helmet` | Auth, CORS, JWT, hardening          |
| Docs              | `@elysiajs/swagger` `@elysiajs/openapi`                                | Auto‑generated Swagger / OpenAPI UI |
| GraphQL           | `@elysiajs/graphql-apollo` `@elysiajs/graphql-yoga`                    | Optional GraphQL endpoint           |
| Static            | `@elysiajs/static`                                                     | Serve Next.js `/public` assets      |
| Cron / background | `@elysiajs/cron` `@elysiajs/background`                                | Periodic jobs (e.g. model warm‑up)  |
| Rate‑limit        | `@elysiajs/rate-limit`                                                 | Throttle LLM calls                  |
| Logging           | `@elysiajs/logger` `pino`                                              | Structured request logs             |
| Env / config      | `@elysiajs/env`                                                        | Typed env vars                      |

Install with one line:

```bash
bun add elysia @elysiajs/eden @sinclair/typebox \
  @elysiajs/bearer @elysiajs/cors @elysiajs/jwt @elysiajs/helmet \
  @elysiajs/swagger @elysiajs/openapi @elysiajs/static \
  @elysiajs/cron @elysiajs/background @elysiajs/rate-limit \
  @elysiajs/logger pino @elysiajs/env
```

## 🎉 TL;DR

1. Put an `Elysia` instance in `app/api/[[...slugs]]/route.ts` and export `GET`, `POST`, … using `app.fetch`.
2. Use **Eden** on the client for type‑safe calls.
3. Leverage validation (`t.Object`, Zod, etc.), lazy plugins, and optional GraphQL plugins for richer APIs.
4. Keep a clean folder layout and run everything with **Bun** for the fastest dev experience.
5. Use **plugins** for modular features (validation, swagger, static files, GraphQL).
6. Leverage **deduplication** (`name` / `seed`) when re‑using plugins.
7. Apply **lazy‑load** for heavy modules (e.g., large LLM SDK).
8. Decorate shared services (LLM client, DB, logger) for type‑safe access.
9. Combine **Eden** client on the front‑end for full type safety.

## 🧩 Official Plugins Reference

| Plugin                       | What it does (≤1 sentence)                                           | Doc link                                                               |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **@elysiajs/bearer**         | Extract Bearer token from `Authorization` header automatically.      | [/plugins/bearer](https://elysiajs.com/plugins/bearer)                 |
| **@elysiajs/cors**           | Configure CORS headers for cross‑origin LLM requests.                | [/plugins/cors](https://elysiajs.com/plugins/cors)                     |
| **@elysiajs/cron**           | Schedule recurring jobs (e.g., model warm‑up).                       | [/plugins/cron](https://elysiajs.com/plugins/cron)                     |
| **@elysiajs/eden**           | Generate a type‑safe client from server schema (Eden Treaty).        | [/eden/overview](https://elysiajs.com/eden/overview)                   |
| **@elysiajs/graphql-apollo** | Run Apollo GraphQL server alongside REST LLM endpoints.              | [/plugins/graphql-apollo](https://elysiajs.com/plugins/graphql-apollo) |
| **@elysiajs/graphql-yoga**   | Alternative GraphQL server (Yoga) for LLM schema.                    | [/plugins/graphql-yoga](https://elysiajs.com/plugins/graphql-yoga)     |
| **@elysiajs/html**           | Render raw HTML responses (useful for test UI).                      | [/plugins/html](https://elysiajs.com/plugins/html)                     |
| **@elysiajs/jwt**            | Sign & verify JWTs for auth‑protected LLM routes.                    | [/plugins/jwt](https://elysiajs.com/plugins/jwt)                       |
| **@elysiajs/openapi**        | Produce OpenAPI JSON spec from route definitions.                    | [/plugins/openapi](https://elysiajs.com/plugins/openapi)               |
| **@elysiajs/swagger**        | UI for the OpenAPI spec (Swagger UI).                                | [/plugins/swagger](https://elysiajs.com/plugins/swagger)               |
| **@elysiajs/static**         | Serve static files (public folder) from the same process.            | [/plugins/static](https://elysiajs.com/plugins/static)                 |
| **@elysiajs/rate-limit**     | Simple request throttling to protect LLM budget.                     | [/plugins/rate-limit](https://elysiajs.com/plugins/rate-limit)         |
| **@elysiajs/logger**         | Structured request logging with Pino.                                | [/plugins/logger](https://elysiajs.com/plugins/logger)                 |
| **@elysiajs/env**            | Type‑safe environment variables via TypeBox.                         | [/plugins/env](https://elysiajs.com/plugins/env)                       |
| **@elysiajs/background**     | Run background tasks (queues) that don't block request thread.       | [/plugins/background](https://elysiajs.com/plugins/background)         |
| **@elysiajs/helmet**         | Set security‑hardening HTTP headers (Content‑Security‑Policy, etc.). | [/plugins/helmet](https://elysiajs.com/plugins/helmet)                 |

## 💡 Common Usage Snippets

### 1. Rate‑limit + JWT auth

```typescript
import { rateLimit } from '@elysiajs/rate-limit';
import { jwt } from '@elysiajs/jwt';

const api = new Elysia()
  .use(rateLimit({ max: 10, windowMs: 60_000 }))
  .use(jwt({ secret: process.env.JWT_SECRET! }))
  .post('/secure-chat', async ({ jwt, body }) => {
    const user = await jwt.verify(); // throws if invalid
    // now call LLM with user info
    return await llm.chat.completions.create({ ... });
  }, {
    body: t.Object({ prompt: t.String() })
  });
```

### 2. Eden client in a React component

```tsx
import { eden } from "@elysiajs/eden";
import { useState } from "react";

const api = eden("/api"); // auto‑typed from server

export function ChatBox() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  const send = async () => {
    const { data } = await api.chat.post({ prompt });
    setAnswer(data);
  };

  return (
    <>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={send}>Ask LLM</button>
      <pre>{answer}</pre>
    </>
  );
}
```

### 3. Cron warm‑up (runs every hour)

```typescript
import { cron } from "@elysiajs/cron";
import { OpenAI } from "openai";

const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

new Elysia()
  .use(
    cron({
      "0 * * * *": async () => {
        await ai.models.retrieve("gpt-4o-mini"); // triggers cache warm‑up
        console.log("🌀 Model warm‑up done");
      },
    })
  )
  .listen(3001);
```

## 🛠️ Bun Commands Reference

| Goal                                    | Command (run from project root)                                        |
| --------------------------------------- | ---------------------------------------------------------------------- |
| **Start dev server (Elysia + Next)**    | `bun run dev`                                                          |
| **Compile TypeScript only**             | `bun build ./src/server.ts --outdir dist`                              |
| **Run tests (Bun test runner)**         | `bun test`                                                             |
| **Watch for changes (Bun --watch)**     | `bun run src/server.ts --watch`                                        |
| **Add a new dependency**                | `bun add <pkg>`                                                        |
| **Add a dev‑only dependency**           | `bun add -D <pkg>`                                                     |
| **Check outdated packages**             | `bun outdated`                                                         |
| **Run linter (eslint)**                 | `bunx eslint . --fix`                                                  |
| **Format (prettier)**                   | `bunx prettier . --write`                                              |
| **Generate OpenAPI spec to file**       | `bun run node -e "import('./src/server.ts').then(m=>m.app.openAPI())"` |
| **Start only the Elysia API (no Next)** | `bun src/server.ts`                                                    |
| **Remove a package**                    | `bun remove <pkg>`                                                     |
| **Run a one‑off script**                | `bun run ./scripts/seed.ts`                                            |

## 🚀 Quick-start Script

```bash
#!/usr/bin/env bash
# init‑next‑elysia.sh - creates a fresh Bun + Next.js + Elysia repo

set -e
PROJECT=${1:-my‑llm‑app}
mkdir $PROJECT && cd $PROJECT

# 1️⃣ Init Bun + TypeScript
bun init -y

# 2️⃣ Install deps
bun i -D elysia @elysiajs/eden @sinclair/typebox \
  @elysiajs/bearer @elysiajs/cors @elysiajs/jwt @elysiajs/helmet \
  @elysiajs/swagger @elysiajs/openapi @elysiajs/static \
  @elysiajs/cron @elysiajs/background @elysiajs/rate-limit \
  @elysiajs/logger pino @elysiajs/env

# 3️⃣ Create Next.js app (App Router)
bunx create-next-app@latest . --ts --app --eslint --src-dir --import-alias "@/*"

echo "✅ Project $PROJECT ready! Run: bun run dev"
```
