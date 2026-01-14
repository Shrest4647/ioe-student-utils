### API Changes from Drizzle v1 to v2

#### Relations Schema Definition

- **Unified Relations**: In v2, relations are defined in one place using `defineRelations(schema, (r) => ({ ... }))`. No need for separate `relations` objects per table.
- **Autocomplete**: The `r` parameter provides full autocomplete for tables and functions like `one`, `many`, `through`.
- **Example**:

  ```ts
  // relations.ts
  import * as schema from "./schema";
  import { defineRelations } from "drizzle-orm";

  export const relations = defineRelations(schema, (r) => ({
    users: {
      invitee: r.one.users({ from: r.users.invitedBy, to: r.users.id }),
      posts: r.many.posts(),
    },
    posts: {
      author: r.one.users({ from: r.posts.authorId, to: r.users.id }),
    },
  }));
  ```

- **DB Instance**: Pass relations to `drizzle()`: `const db = drizzle(process.env.DATABASE_URL, { relations });`

#### Key Differences

- **One Place for Relations**: v1 required separate relation objects; v2 consolidates them.
- **Define Many Without One**: v2 allows defining `many` relations without specifying the inverse `one`.
- **Optional Option**: New `optional: false` to make relations required at type level.
- **No Modes in drizzle()**: Removed mode specification for MySQL dialects.
- **from/to Instead of fields/references**: Renamed and support single values or arrays.
- **relationName -> alias**: Renamed for relation aliases.
- **Custom Types**: Added `fromJson` and `forJsonSelect` functions for data mapping in JSON queries.

#### New Features

- **Through for Many-to-Many**: Use `through` to define junction table relations directly.
  ```ts
  users: {
    groups: r.many.groups({
      from: r.users.id.through(r.usersToGroups.userId),
      to: r.groups.id.through(r.usersToGroups.groupId),
    }),
  },
  ```
- **Predefined Filters**: Add `where` clauses to relations for filtered queries.
- **Where as Object**: Queries use object syntax instead of functions: `where: { id: 1 }`.
- **OrderBy as Object**: `orderBy: { id: "asc" }`.
- **Filtering by Relations**: Filter based on related data: `where: { posts: { content: { like: "M%" } } }`.
- **Offset on Related Objects**: Apply offset/limit to nested relations.
