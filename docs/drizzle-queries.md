# Drizzle Queries

Drizzle ORM provides relational queries for nested relational data from SQL databases, avoiding multiple joins and complex mappings.

## Setup

Relational queries extend the query builder. Provide tables and relations upon drizzle initialization.

```ts
import { relations } from "./relations";
import { drizzle } from "drizzle-orm/...";

const db = drizzle({ relations });
```

## findMany and findFirst

- `findMany()`: Returns array of records
- `findFirst()`: Returns single record or null, adds `LIMIT 1`

```ts
const users = await db.query.users.findMany();
const user = await db.query.users.findFirst();
```

## Include Relations

Use `with` to combine data from related tables.

```ts
const posts = await db.query.posts.findMany({
  with: {
    comments: true,
  },
});
```

Nest `with` for deeper relations.

```ts
const users = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        comments: true,
      },
    },
  },
});
```

## Partial Fields Select

Use `columns` to include/exclude fields. Performs partial selects at query level.

```ts
const posts = await db.query.posts.findMany({
  columns: {
    id: true,
    content: true,
  },
  with: {
    comments: true,
  },
});
```

Exclude fields:

```ts
const posts = await db.query.posts.findMany({
  columns: {
    content: false,
  },
});
```

When both `true` and `false` are present, `false` options are ignored.

## Select Filters

Use `where` with operators.

```ts
const users = await db.query.users.findMany({
  where: {
    id: 1,
  },
});
```

Operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `like`, `ilike`, `notLike`, `notIlike`, `isNull`, `isNotNull`, `arrayOverlaps`, `arrayContained`, `arrayContains`.

Complex conditions with `AND`, `OR`, `NOT`, `RAW`.

Examples:

```ts
// Simple
where: { age: 15 }

// AND
where: { age: 15, name: 'John' }

// OR
where: {
  OR: [
    { id: { gt: 10 } },
    { name: { like: "John%" } }
  ]
}

// NOT
where: {
  NOT: { id: { gt: 10 } },
  name: { like: "John%" }
}

// RAW
where: {
  RAW: (table) => sql`${table.id} = 1`
}
```

## Relations Filters

Filter by related tables.

```ts
const usersWithPosts = await db.query.users.findMany({
  where: {
    id: { gt: 10 },
    posts: {
      content: { like: "M%" },
    },
  },
});
```

Filter existence:

```ts
const response = db.query.users.findMany({
  with: { posts: true },
  where: { posts: true },
});
```

## Limit & Offset

```ts
await db.query.posts.findMany({
  limit: 5,
  offset: 2,
});
```

In nested relations:

```ts
await db.query.posts.findMany({
  with: {
    comments: {
      limit: 3,
      offset: 3,
    },
  },
});
```

## Order By

```ts
await db.query.posts.findMany({
  orderBy: { id: "asc" },
});
```

Multiple orderBy in same table are applied in order.

Custom SQL:

```ts
await db.query.posts.findMany({
  orderBy: (t) => sql`${t.id} asc`,
});
```

## Include Custom Fields (Extras)

Add computed fields. Aggregations not supported; use core queries.

```ts
await db.query.users.findMany({
  extras: {
    loweredName: sql`lower(${users.name})`,
  },
});
```

Or with callback:

```ts
extras: {
  loweredName: (users, { sql }) => sql`lower(${users.name})`;
}
```

## Include Subqueries

Use for custom SQL.

```ts
await db.query.users.findMany({
  with: { posts: true },
  extras: {
    totalPostsCount: (table) => db.$count(posts, eq(posts.authorId, table.id)),
  },
});
```

## Prepared Statements

Improve performance with placeholders.

```ts
const prepared = db.query.users
  .findMany({
    where: { id: { eq: sql.placeholder("id") } },
    with: { posts: { where: { id: 1 } } },
  })
  .prepare();

const usersWithPosts = await prepared.execute({ id: 1 });
```

Placeholders in `limit`, `offset`, etc.
