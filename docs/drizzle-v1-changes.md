### API changes

#### What is working differently from v1

{/_ ##### Drizzle Relations schema definition _/}

One of the biggest updates were in **Relations Schema definition**

The first difference is that you no longer need to specify `relations` for each table separately in different objects and
then pass them all to `drizzle()` along with your schema. In Relational Queries v2, you now have one dedicated place to
specify all the relations for all the tables you need.

The `r` parameter in the callback provides comprehensive autocomplete
functionality - including all tables from your schema and functions such as `one`, `many`, and `through` - essentially
offering everything you need to specify your relations.

```ts
// relations.ts
import * as schema from "./schema"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
    ...
}));
```

```ts
// index.ts
import { relations } from "./relations";
import { drizzle } from "drizzle-orm/...";

const db = drizzle(process.env.DATABASE_URL, { relations });
```

##### What is different?

<Callout collapsed="Schema Definition">
```ts copy {21-28}
import * as p from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = p.pgTable('users', {
id: p.integer().primaryKey(),
name: p.text(),
invitedBy: p.integer('invited_by'),
});

export const posts = p.pgTable('posts', {
id: p.integer().primaryKey(),
content: p.text(),
authorId: p.integer('author_id'),
});

````
</Callout>

**One place for all your relations**

<Callout title="❌ v1">
```ts
import { relations } from "drizzle-orm/_relations";
import { users, posts } from './schema';

export const usersRelation = relations(users, ({ one, many }) => ({
  invitee: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
  posts: many(posts),
}));

export const postsRelation = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
````

</Callout>

<Callout title='✅ v2'>
```ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
users: {
invitee: r.one.users({
from: r.users.invitedBy,
to: r.users.id,
}),
posts: r.many.posts(),
},
posts: {
author: r.one.users({
from: r.posts.authorId,
to: r.users.id,
}),
},
}));

````
</Callout>

You can still separate it into different `parts`, and you can make the parts any size you want

```ts
import { defineRelations, defineRelationsPart } from 'drizzle-orm';
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    invitee: r.one.users({
      from: r.users.invitedBy,
      to: r.users.id,
    }),
    posts: r.many.posts(),
  }
}));

export const part = defineRelationsPart(schema, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  }
}));
````

and then you can provide it to the db instance

```ts
const db = drizzle(process.env.DB_URL, {
  relations: { ...relations, ...part },
});
```

**Define `many` without `one`**

In v1, if you wanted only the `many` side of a relationship, you had to specify the `one` side on the other end,
which made for a poor developer experience.

In v2, you can simply use the `many` side without any additional steps

<Callout title="❌ v1">
```ts
import { relations } from "drizzle-orm/_relations";
import { users, posts } from './schema';

export const usersRelation = relations(users, ({ one, many }) => ({
posts: many(posts),
}));

export const postsRelation = relations(posts, ({ one, many }) => ({
author: one(users, {
fields: [posts.authorId],
references: [users.id],
}),
}));

````
</Callout>

<Callout title='✅ v2'>
```ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    posts: r.many.posts({
      from: r.users.id,
      to: r.posts.authorId,
    }),
  },
}));
````

</Callout>

**New `optional` option**

`optional: false` at the type level makes the `author` key in the `posts` object required.
This should be used when you are certain that this specific entity will always exist.

<Callout title="❌ v1">
Was not supported in v1
</Callout>

<Callout title='✅ v2'>
```ts {9}
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
users: {
posts: r.many.posts({
from: r.users.id,
to: r.posts.authorId,
optional: false,
}),
},
}));

````
</Callout>

**No modes in `drizzle()`**

We found a way to use the same strategy for all MySQL dialects, so there's no need to specify them

<Callout title="❌ v1">
```ts
import * as schema from './schema'

const db = drizzle(process.env.DATABASE_URL, { mode: "planetscale", schema });
// or
const db = drizzle(process.env.DATABASE_URL, { mode: "default", schema });
````

</Callout>

<Callout title='✅ v2'>
```ts
import { relations } from './relations'

const db = drizzle(process.env.DATABASE_URL, { relations });

````
</Callout>

**`from` and `to` upgrades**

We've renamed `fields` to `from` and `references` to `to`, and we made both accept either a single value or an array

<Callout title="❌ v1">
```ts
...
author: one(users, {
  fields: [posts.authorId],
  references: [users.id],
}),
...
````

</Callout>

<Callout title='✅ v2'>
```ts
... 
author: r.one.users({
  from: r.posts.authorId,
  to: r.users.id,
}),
...
```
```ts
... 
author: r.one.users({
  from: [r.posts.authorId],
  to: [r.users.id],
}),
...
```
</Callout>

**`relationName` -> `alias`**

<Callout title="❌ v1">
```ts
import { relations } from "drizzle-orm/_relations";
import { users, posts } from './schema';

export const postsRelation = relations(posts, ({ one }) => ({
author: one(users, {
fields: [posts.authorId],
references: [users.id],
relationName: "author_post",
}),
}));

````
</Callout>

<Callout title='✅ v2'>
```ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      alias: "author_post",
    }),
  },
}));
````

</Callout>

**`custom types` new functions**

There are a few new function were added to custom types, so you can control how data is mapped on Relational Queries v2:

<Callout collapsed='fromJson'>
Optional mapping function, that is used for transforming data returned by transformed to JSON in database data to desired format
For example, when querying bigint column via [RQB](https://orm.drizzle.team/docs/rqb-v2) or [JSON functions](https://orm.drizzle.team/docs/json-functions), the result field will be returned as it's string representation, as opposed to bigint from regular query
To handle that, we need a separate function to handle such field's mapping:
```ts
fromJson(value: string): bigint {
	return BigInt(value);
},
```
It'll cause the returned data to change from:
```ts
{
	customField: "5044565289845416380";
}
```
to:
```ts
{
	customField: 5044565289845416380n;
}
```
</Callout> 
<Callout collapsed='forJsonSelect'>
Optional selection modifier function, that is used for modifying selection of column inside [JSON functions](https://orm.drizzle.team/docs/json-functions)
Additional mapping that could be required for such scenarios can be handled using fromJson function
Used by [relational queries](https://orm.drizzle.team/docs/rqb-v2)

For example, when using bigint we need to cast field to text to preserve data integrity

```ts
forJsonSelect(identifier: SQL, sql: SQLGenerator, arrayDimensions?: number): SQL {
	return sql`${identifier}::text`
},
```

This will change query from:

```sql
SELECT
	row_to_json("t".*)
	FROM
	(
		SELECT
		"table"."custom_bigint" AS "bigint"
		FROM
		"table"
	) AS "t"
```

to:

```sql
SELECT
	row_to_json("t".*)
	FROM
	(
		SELECT
		"table"."custom_bigint"::text AS "bigint"
		FROM
		"table"
	) AS "t"
```

Returned by query object will change from:

```ts
{
  bigint: 5044565289845416000; // Partial data loss due to direct conversion to JSON format
}
```

to:

```ts
{
  bigint: "5044565289845416380"; // Data is preserved due to conversion of field to text before JSON-ification
}
```

</Callout>

<Callout title='✅ v2'>
```ts
const customBytes = customType<{
 	data: Buffer;
 	driverData: Buffer;
 	jsonData: string;
 }>({
 	dataType: () => 'bytea',
 	fromJson: (value) => {
 		return Buffer.from(value.slice(2, value.length), 'hex');
 	},
 	forJsonSelect: (identifier, sql, arrayDimensions) =>
 		sql`${identifier}::text${sql.raw('[]'.repeat(arrayDimensions ?? 0))}`,
 });
```

</Callout>

##### What is new?

**`through` for many-to-many relations**

Previously, you would need to query through a junction table and then map it out for every response

You don't need to do it now!

<Callout collapsed='Schema'>
```ts
import * as p from "drizzle-orm/pg-core";

export const users = p.pgTable("users", {
id: p.integer().primaryKey(),
name: p.text(),
verified: p.boolean().notNull(),
});

export const groups = p.pgTable("groups", {
id: p.integer().primaryKey(),
name: p.text(),
});

export const usersToGroups = p.pgTable(
"users_to_groups",
{
userId: p
.integer("user_id")
.notNull()
.references(() => users.id),
groupId: p
.integer("group_id")
.notNull()
.references(() => groups.id),
},
(t) => [p.primaryKey({ columns: [t.userId, t.groupId] })]
);

````
</Callout>

<Callout title="❌ v1">
```ts
export const usersRelations = relations(users, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
}));
````

```ts
// Query example
const response = await db.query.users.findMany({
  with: {
    usersToGroups: {
      columns: {},
      with: {
        group: true,
      },
    },
  },
});
```

</Callout>

<Callout title='✅ v2'>
```ts
import * as schema from './schema';
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(schema, (r) => ({
users: {
groups: r.many.groups({
from: r.users.id.through(r.usersToGroups.userId),
to: r.groups.id.through(r.usersToGroups.groupId),
}),
},
groups: {
participants: r.many.users(),
},
}));

````
```ts
// Query example
const response = await db.query.users.findMany({
  with: {
    groups: true,
  },
});
````

</Callout>

**Predefined filters**

<Callout title="❌ v1">
Was not supported in v1
</Callout>

<Callout title='✅ v2'>
```ts {10-12}
import * as schema from './schema';
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(schema,
(r) => ({
groups: {
verifiedUsers: r.many.users({
from: r.groups.id.through(r.usersToGroups.groupId),
to: r.users.id.through(r.usersToGroups.userId),
where: {
verified: true,
},
}),
},
})
);

````
```ts {4}
// Query example: get groups with all verified users
const response = await db.query.groups.findMany({
  with: {
    verifiedUsers: true,
  },
});
````

</Callout>

##### `where` is now object

<Callout title="❌ v1">
```ts
const response = db._query.users.findMany({
  where: (users, { eq }) => eq(users.id, 1),
});
```
</Callout>

<Callout title="✅ v2">
```ts
const response = db.query.users.findMany({
  where: {
    id: 1,
  },
});
```

For a complete API Reference please check our [Select Filters docs](/docs/rqb-v2#select-filters)
</Callout>

<Callout collapsed='Complex filter example using RAW'>
```ts
// schema.ts
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
id: integer("id").primaryKey(),
name: text("name"),
email: text("email").notNull(),
age: integer("age"),
createdAt: timestamp("created_at").defaultNow(),
lastLogin: timestamp("last_login"),
subscriptionEnd: timestamp("subscription_end"),
lastActivity: timestamp("last_activity"),
preferences: jsonb("preferences"), // JSON column for user settings/preferences
interests: text("interests").array(), // Array column for user interests
});

````
```ts
const response = db.query.users.findMany({
  where: {
    AND: [
      {
        OR: [
          { RAW: (table) => sql`LOWER(${table.name}) LIKE 'john%'` },
          { name: { ilike: "jane%" } },
        ],
      },
      {
        OR: [
          { RAW: (table) => sql`${table.preferences}->>'theme' = 'dark'` },
          { RAW: (table) => sql`${table.preferences}->>'theme' IS NULL` },
        ],
      },
      { RAW: (table) => sql`${table.age} BETWEEN 25 AND 35` },
    ],
  },
});
````

</Callout>

##### `orderBy` is now object

<Callout title="❌ v1">
```ts
const response = db._query.users.findMany({
  orderBy: (users, { asc }) => [asc(users.id)],
});
```
</Callout>

<Callout title="✅ v2">
```ts
const response = db.query.users.findMany({
  orderBy: { id: "asc" },
});
```
</Callout>

##### Filtering by relations

<Callout title="❌ v1">
Was not supported in v1
</Callout>

<Callout title='✅ v2'>
Example: Get all users whose ID>10 and who have at least one post with content starting with “M”

```ts
const usersWithPosts = await db.query.usersTable.findMany({
  where: {
    id: {
      gt: 10,
    },
    posts: {
      content: {
        like: "M%",
      },
    },
  },
});
```

</Callout>

##### Using offset on related objects

<Callout title="❌ v1">
Was not supported in v1
</Callout>

<Callout title='✅ v2'>
```ts
await db.query.posts.findMany({
	limit: 5,
	offset: 2, // correct ✅
	with: {
		comments: {
			offset: 3, // correct ✅
			limit: 3,
		},
	},
});
```
</Callout>
