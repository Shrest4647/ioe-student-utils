---
url: "https://elysiajs.com/eden/edenTreaty/overview.md"
---

# Eden Treaty

Eden Treaty is an object representation to interact with a server and features type safety, auto-completion, and error handling.

To use Eden Treaty, first export your existing Elysia server type:

```typescript
// server.ts
import { Elysia, t } from "elysia";

const app = new Elysia()
  .get("/hi", () => "Hi Elysia")
  .get("/id/:id", ({ params: { id } }) => id)
  .post("/mirror", ({ body }) => body, {
    body: t.Object({
      id: t.Number(),
      name: t.String(),
    }),
  })
  .listen(3000);

export type App = typeof app; // [!code ++]
```

Then import the server type and consume the Elysia API on the client:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from "elysia";

const app = new Elysia()
  .get("/hi", () => "Hi Elysia")
  .get("/id/:id", ({ params: { id } }) => id)
  .post("/mirror", ({ body }) => body, {
    body: t.Object({
      id: t.Number(),
      name: t.String(),
    }),
  })
  .listen(3000);

export type App = typeof app; // [!code ++]

// @filename: client.ts
// ---cut---
// client.ts
import { edenTreaty } from "@elysiajs/eden";
import type { App } from "./server"; // [!code ++]

const app = edenTreaty<App>("localhost:3000");

// response type: 'Hi Elysia'
const { data, error } = await app.hi.get();
// ^?
```

## Tree-like syntax

HTTP Path is a resource indicator for a file system tree.

File system consists of multiple levels of folders, for example:

- /documents/elysia
- /documents/kalpas
- /documents/kelvin

Each level is separated by **/** (slash) and a name.

However in JavaScript, instead of using **"/"** (slash) we use **"."** (dot) to access deeper resources.

Eden Treaty turns an Elysia server into a tree-like file system that can be accessed in the JavaScript frontend instead.

| Path         | Treaty       |
| ------------ | ------------ |
| /            |              |
| /hi          | .hi          |
| /deep/nested | .deep.nested |

Combined with the HTTP method, we can interact with the Elysia server.

| Path         | Method | Treaty              |
| ------------ | ------ | ------------------- |
| /            | GET    | .get()              |
| /hi          | GET    | .hi.get()           |
| /deep/nested | GET    | .deep.nested.get()  |
| /deep/nested | POST   | .deep.nested.post() |

## Dynamic path

However, dynamic path parameters cannot be expressed using notation. If they are fully replaced, we don't know what the parameter name is supposed to be.

```typescript
// ❌ Unclear what the value is supposed to represent?
edenTreaty.item["skadi"].get();
```

To handle this, we can specify a dynamic path using a function to provide a key value instead.

```typescript
// ✅ Clear that value is dynamic path is 'name'
edenTreaty.item({ name: "Skadi" }).get();
```

| Path           | Treaty                      |
| -------------- | --------------------------- |
| /item          | .item                       |
| /item/:name    | .item({ name: 'Skadi' })    |
| /item/:name/id | .item({ name: 'Skadi' }).id |

---

## url: 'https://elysiajs.com/eden/edenTreaty/parameters.md'

# Parameters

We need to send a payload to server eventually.

To handle this, Eden Treaty's methods accept 2 parameters to send data to server.

Both parameters are type safe and will be guided by TypeScript automatically:

1. body
2. additional parameters
   - query
   - headers
   - fetch

```typescript
import { Elysia, t } from "elysia";
import { edenTreaty } from "@elysiajs/eden";

const app = new Elysia()
  .post("/user", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  })
  .listen(3000);

const { api } = edenTreaty<typeof app>("localhost:3000");

// ✅ works
api.user.post({
  name: "Elysia",
});

// ✅ also works
api.user.post(
  {
    name: "Elysia",
  },
  {
    // This is optional as not specified in schema
    headers: {
      authorization: "Bearer 12345",
    },
    query: {
      id: 2,
    },
  }
);
```

Unless if the method doesn't accept body, then body will be omitted and left with single parameter only.

If the method **"GET"** or **"HEAD"**:

1. Additional parameters
   - query
   - headers
   - fetch

```typescript
import { Elysia } from "elysia";
import { edenTreaty } from "@elysiajs/eden";

const app = new Elysia().get("/hello", () => "hi").listen(3000);

const { api } = edenTreaty<typeof app>("localhost:3000");

// ✅ works
api.hello.get({
  // This is optional as not specified in schema
  headers: {
    hello: "world",
  },
});
```

## Empty body

If body is optional or not need but query or headers is required, you may pass the body as `null` or `undefined` instead.

```typescript
import { Elysia, t } from "elysia";
import { edenTreaty } from "@elysiajs/eden";

const app = new Elysia()
  .post("/user", () => "hi", {
    query: t.Object({
      name: t.String(),
    }),
  })
  .listen(3000);

const { api } = edenTreaty<typeof app>("localhost:3000");

api.user.post(null, {
  query: {
    name: "Ely",
  },
});
```

## Fetch parameters

Eden Treaty is a fetch wrapper, we may add any valid [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) parameters to Eden by passing it to `$fetch`:

```typescript
import { Elysia, t } from "elysia";
import { edenTreaty } from "@elysiajs/eden";

const app = new Elysia().get("/hello", () => "hi").listen(3000);

const { api } = edenTreaty<typeof app>("localhost:3000");

const controller = new AbortController();

const cancelRequest = setTimeout(() => {
  controller.abort();
}, 5000);

await api.hello.get({
  fetch: {
    signal: controller.signal,
  },
});

clearTimeout(cancelRequest);
```

## File Upload

We may either pass one of the following to attach file(s):

- **File**
- **File\[]**
- **FileList**
- **Blob**

Attaching a file will results **content-type** to be **multipart/form-data**

Suppose we have the server as the following:

```typescript
import { Elysia, t } from "elysia";
import { edenTreaty } from "@elysiajs/eden";

const app = new Elysia()
  .post("/image", ({ body: { image, title } }) => title, {
    body: t.Object({
      title: t.String(),
      image: t.Files(),
    }),
  })
  .listen(3000);

export const { api } = edenTreaty<typeof app>("localhost:3000");

const images = document.getElementById("images") as HTMLInputElement;

const { data } = await api.image.post({
  title: "Misono Mika",
  image: images.files!,
});
```
