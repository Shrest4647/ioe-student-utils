# Course Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use @superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive course exploration tool with mindmap visualization, hierarchical course structure, and curated study paths to help students understand course content and relationships.

**Architecture:** Graph-based course data model (units → topics → subtopics) with prerequisite relationships, nested mindmap visualization (classic layout), contextual sources panel, and decoupled design from Study Planner. No backend AI - all AI assistance via external agents using MCP tools.

**Tech Stack:**
- Backend: Elysia.js, Drizzle ORM (v1 beta), PostgreSQL, better-auth
- Frontend: Next.js 16, React 19, Framer Motion, Tailwind CSS 4
- Mindmap: React Flow or D3.js (to be selected)
- MCP Tools: IOESU MCP server for bulk operations

---

## Phase 1: Database Schema & Migrations

### Task 1: Add Course Units Table

**Files:**
- Create: `src/server/db/schema/units.ts`
- Modify: `src/server/db/schema.ts`
- Test: `src/server/db/__tests__/units.test.ts`

**Step 1: Write the failing test**

Create `src/server/db/__tests__/units.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { db } from "../index";
import { courseUnits } from "../schema/units";

describe("course_units table", () => {
  it("should create a unit with required fields", async () => {
    const unit = {
      id: crypto.randomUUID(),
      courseId: "test-course-id",
      name: "Module 1: Foundations",
      description: "Introduction to data structures",
      sortOrder: 1,
      unitType: "module" as const,
    };

    await db.insert(courseUnits).values(unit);

    const result = await db.query.courseUnits.findFirst({
      where: (units, { eq }) => eq(units.id, unit.id),
    });

    expect(result).toBeDefined();
    expect(result?.name).toBe(unit.name);
    expect(result?.unitType).toBe("module");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/db/__tests__/units.test.ts`
Expected: FAIL with "table course_units does not exist"

**Step 3: Create schema definition**

Create `src/server/db/schema/units.ts`:
```typescript
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courses } from "./courses";

export const courseUnits = pgTable("course_unit", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  unitType: text("unit_type", { enum: ["module", "chapter"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});
```

**Step 4: Export from schema**

Modify `src/server/db/schema.ts`:
Add at end of file:
```typescript
export * from "./schema/units";
```

**Step 5: Generate and run migration**

Run: `bun db:generate`
Run: `bun db:push`

**Step 6: Run test to verify it passes**

Run: `bun test src/server/db/__tests__/units.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/server/db/schema/units.ts src/server/db/schema.ts src/server/db/__tests__/units.test.ts
git commit -m "feat(course-explorer): add course_units table"
```

---

### Task 2: Add Course Topics Table

**Files:**
- Create: `src/server/db/schema/topics.ts`
- Modify: `src/server/db/schema.ts`
- Test: `src/server/db/__tests__/topics.test.ts`

**Step 1: Write the failing test**

Create `src/server/db/__tests__/topics.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { db } from "../index";
import { courseTopics } from "../schema/topics";

describe("course_topics table", () => {
  it("should create a topic with hierarchical structure", async () => {
    const topic = {
      id: crypto.randomUUID(),
      unitId: "test-unit-id",
      name: "Binary Search Trees",
      description: "Introduction to BST",
      priorityLevel: "core" as const,
      hours: 8,
      weightage: 15,
      sortOrder: 1,
    };

    await db.insert(courseTopics).values(topic);

    const result = await db.query.courseTopics.findFirst({
      where: (topics, { eq }) => eq(topics.id, topic.id),
    });

    expect(result).toBeDefined();
    expect(result?.name).toBe(topic.name);
    expect(result?.priorityLevel).toBe("core");
  });

  it("should support nested subtopics", async () => {
    const parentTopic = {
      id: crypto.randomUUID(),
      unitId: "test-unit-id",
      name: "Trees",
      priorityLevel: "important" as const,
      hours: 10,
      weightage: 20,
      sortOrder: 1,
    };

    const childTopic = {
      id: crypto.randomUUID(),
      unitId: "test-unit-id",
      parentTopicId: parentTopic.id,
      name: "Binary Trees",
      priorityLevel: "important" as const,
      hours: 5,
      weightage: 10,
      sortOrder: 1,
    };

    await db.insert(courseTopics).values(parentTopic);
    await db.insert(courseTopics).values(childTopic);

    const result = await db.query.courseTopics.findFirst({
      where: (topics, { eq }) => eq(topics.id, childTopic.id),
      with: {
        parentTopic: true,
      },
    });

    expect(result?.parentTopic?.name).toBe("Trees");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/db/__tests__/topics.test.ts`
Expected: FAIL with "table course_topics does not exist"

**Step 3: Create schema definition**

Create `src/server/db/schema/topics.ts`:
```typescript
import { boolean, decimal, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseUnits } from "./units";

export const courseTopics = pgTable("course_topic", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  parentTopicId: text("parent_topic_id").references(
    (): any => courseTopics.id,
    { onDelete: "set null" }
  ),
  name: text("name").notNull(),
  description: text("description"),
  priorityLevel: text("priority_level", { enum: ["core", "important", "optional"] }).notNull(),
  hours: integer("hours").notNull().default(0),
  weightage: decimal("weightage", { precision: 5, scale: 2 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isExternalReference: boolean("is_external_reference").notNull().default(false),
  externalTopicId: text("external_topic_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});
```

**Step 4: Export from schema**

Modify `src/server/db/schema.ts`:
Add: `export * from "./schema/topics";`

**Step 5: Generate and run migration**

Run: `bun db:generate`
Run: `bun db:push`

**Step 6: Run test to verify it passes**

Run: `bun test src/server/db/__tests__/topics.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/server/db/schema/topics.ts src/server/db/schema.ts src/server/db/__tests__/topics.test.ts
git commit -m "feat(course-explorer): add course_topics table with hierarchy"
```

---

### Task 3: Add Prerequisite Relationships

**Files:**
- Create: `src/server/db/schema/prerequisites.ts`
- Modify: `src/server/db/schema.ts`, `src/server/db/relations.ts`
- Test: `src/server/db/__tests__/prerequisites.test.ts`

**Step 1: Write the failing test**

Create `src/server/db/__tests__/prerequisites.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { db } from "../index";
import { topicPrerequisites } from "../schema/prerequisites";

describe("topic_prerequisites table", () => {
  it("should create prerequisite relationship", async () => {
    const prereq = {
      id: crypto.randomUUID(),
      topicId: "topic-2",
      prerequisiteTopicId: "topic-1",
      dependencyType: "strong" as const,
    };

    await db.insert(topicPrerequisites).values(prereq);

    const result = await db.query.topicPrerequisites.findFirst({
      where: (p, { eq }) => eq(p.id, prereq.id),
    });

    expect(result).toBeDefined();
    expect(result?.dependencyType).toBe("strong");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/db/__tests__/prerequisites.test.ts`
Expected: FAIL

**Step 3: Create schema**

Create `src/server/db/schema/prerequisites.ts`:
```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseTopics } from "./topics";

export const topicPrerequisites = pgTable("topic_prerequisite", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  prerequisiteTopicId: text("prerequisite_topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type", { enum: ["strong", "weak"] }).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});
```

**Step 4: Create unit prerequisites**

Add to same file:
```typescript
export const unitPrerequisites = pgTable("unit_prerequisite", {
  id: text("id").primaryKey(),
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  prerequisiteUnitId: text("prerequisite_unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type", { enum: ["strong", "weak"] }).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});
```

**Step 5: Export and migrate**

Update `src/server/db/schema.ts`:
Add: `export * from "./schema/prerequisites";`

Run: `bun db:generate`
Run: `bun db:push`

**Step 6: Run test to verify it passes**

Run: `bun test src/server/db/__tests__/prerequisites.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/server/db/schema/prerequisites.ts src/server/db/schema.ts src/server/db/__tests__/prerequisites.test.ts
git commit -m "feat(course-explorer): add prerequisite relationship tables"
```

---

### Task 4: Add Resource Links & Tags

**Files:**
- Create: `src/server/db/schema/resource-links.ts`
- Modify: `src/server/db/schema.ts`, `src/server/db/schema.ts` (resources table)
- Test: `src/server/db/__tests__/resource-links.test.ts`

**Step 1: Write the failing test**

Create `src/server/db/__tests__/resource-links.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { db } from "../index";
import { topicResourceLinks, resourceTags } from "../schema/resource-links";

describe("topic_resource_links table", () => {
  it("should link topic to existing resource", async () => {
    const link = {
      id: crypto.randomUUID(),
      topicId: "test-topic-id",
      resourceId: "test-resource-id",
      relevance: "primary" as const,
      sortOrder: 1,
    };

    await db.insert(topicResourceLinks).values(link);

    const result = await db.query.topicResourceLinks.findFirst({
      where: (l, { eq }) => eq(l.id, link.id),
    });

    expect(result?.relevance).toBe("primary");
  });
});

describe("resource_tags table", () => {
  it("should add tag to resource", async () => {
    const tag = {
      id: crypto.randomUUID(),
      resourceId: "test-resource-id",
      tag: "algorithms",
    };

    await db.insert(resourceTags).values(tag);

    const result = await db.query.resourceTags.findFirst({
      where: (t, { eq }) => eq(t.resourceId, tag.resourceId),
    });

    expect(result?.tag).toBe("algorithms");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/server/db/__tests__/resource-links.test.ts`
Expected: FAIL

**Step 3: Create schema**

Create `src/server/db/schema/resource-links.ts`:
```typescript
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { courseTopics } from "./topics";
import { resources } from "./schema"; // existing resources table

export const topicResourceLinks = pgTable("topic_resource_link", {
  id: text("id").primaryKey(),
  topicId: text("topic_id")
    .notNull()
    .references(() => courseTopics.id, { onDelete: "cascade" }),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  relevance: text("relevance", { enum: ["primary", "supplementary", "practice"] }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

export const resourceTags = pgTable("resource_tag", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});
```

**Step 4: Add viewCount to resources table**

Modify `src/server/db/schema.ts` resources table:
Add field:
```typescript
viewCount: integer("view_count").notNull().default(0),
```

**Step 5: Export and migrate**

Update `src/server/db/schema.ts`:
Add: `export * from "./schema/resource-links";`

Run: `bun db:generate`
Run: `bun db:push`

**Step 6: Run test to verify it passes**

Run: `bun test src/server/db/__tests__/resource-links.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/server/db/schema/resource-links.ts src/server/db/schema.ts src/server/db/__tests__/resource-links.test.ts
git commit -m "feat(course-explorer): add resource links and tags"
```

---

## Phase 2: Backend API Implementation

### Task 5: Create Course Routes Structure

**Files:**
- Create: `src/server/api/routes/courses/index.ts`
- Create: `src/server/api/routes/courses/public.ts`
- Create: `src/server/api/routes/courses/admin.ts`
- Modify: `src/server/api/index.ts`

**Step 1: Create public routes file**

Create `src/server/api/routes/courses/public.ts`:
```typescript
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { courses, courseUnits } from "@/server/db/schema";

export const publicCourseRoutes = new Elysia({ prefix: "/courses" })
  .get("/", async () => {
    const allCourses = await db.query.courses.findMany({
      where: (courses, { eq }) => eq(courses.isActive, true),
      columns: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });
    return { success: true, data: allCourses };
  })
  .get("/slug/:slug", async ({ params }) => {
    const course = await db.query.courses.findFirst({
      where: (courses, { eq }) => eq(courses.slug, params.slug),
      with: {
        units: {
          where: (units, { eq }) => eq(units.isActive, true),
          orderBy: (units, { asc }) => asc(units.sortOrder),
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    return { success: true, data: course };
  });
```

**Step 2: Create admin routes file**

Create `src/server/api/routes/courses/admin.ts`:
```typescript
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { courses } from "@/server/db/schema";
import { authenticateServer } from "@/server/auth";

export const adminCourseRoutes = new Elysia({ prefix: "/courses/admin" })
  .use(authenticateServer)
  .get("/", async () => {
    const allCourses = await db.query.courses.findMany({
      with: {
        units: true,
      },
    });
    return { success: true, data: allCourses };
  })
  .post("/", async ({ body }) => {
    const course = {
      id: crypto.randomUUID(),
      ...body,
    };

    await db.insert(courses).values(course);

    return { success: true, data: course };
  }, {
    body: t.Object({
      name: t.String(),
      slug: t.String(),
      description: t.Optional(t.String()),
      code: t.Optional(t.String()),
    }),
  });
```

**Step 3: Register routes**

Modify `src/server/api/index.ts`:
```typescript
import { publicCourseRoutes } from "./routes/courses/public";
import { adminCourseRoutes } from "./routes/courses/admin";

// Register course routes
app.use(publicCourseRoutes);
app.use(adminCourseRoutes);
```

**Step 4: Test with curl**

Run: `curl http://localhost:3001/api/courses`
Expected: JSON response with courses array

**Step 5: Commit**

```bash
git add src/server/api/routes/courses/
git commit -m "feat(course-explorer): add course API routes"
```

---

### Task 6: Implement Mindmap Data Endpoint

**Files:**
- Modify: `src/server/api/routes/courses/public.ts`
- Create: `src/server/api/services/mindmap.ts`

**Step 1: Create mindmap service**

Create `src/server/api/services/mindmap.ts`:
```typescript
import { db } from "@/server/db";
import { courses, courseTopics, topicPrerequisites } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getMindmapData(courseSlug: string, path?: string) {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
    with: {
      units: {
        where: (units, { eq }) => eq(units.isActive, true),
        with: {
          topics: {
            where: (topics, { eq }) => eq(topics.isActive, true),
            with: {
              prerequisites: true,
              resources: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const nodes = course.units.flatMap((unit) =>
    unit.topics.map((topic) => ({
      id: topic.id,
      label: topic.name,
      slug: topic.slug,
      level: calculateLevel(topic),
      priority: topic.priorityLevel,
      weightage: topic.weightage,
      hours: topic.hours,
      description: topic.description,
      unitId: unit.id,
      unitName: unit.name,
    }))
  );

  const edges = course.units.flatMap((unit) =>
    unit.topics.flatMap((topic) =>
      topic.prerequisites.map((prereq) => ({
        from: prereq.prerequisiteTopicId,
        to: topic.id,
        type: prereq.dependencyType,
        label: "prerequisite",
      }))
    )
  );

  // Apply path filtering if specified
  const filteredNodes = path ? filterByPath(nodes, path) : nodes;

  return { nodes: filteredNodes, edges };
}

function calculateLevel(topic: any): number {
  // Core topics = level 1, important = level 2, optional = level 3
  const levels = { core: 1, important: 2, optional: 3 };
  return levels[topic.priorityLevel] || 2;
}

function filterByPath(nodes: any[], path: string): any[] {
  // Implement study path filtering logic
  switch (path) {
    case "exam-prep":
      return nodes.filter((n) => n.weightage > 0);
    case "minimum":
      return nodes.filter((n) => n.priority === "core");
    default:
      return nodes;
  }
}
```

**Step 2: Add endpoint to public routes**

Modify `src/server/api/routes/courses/public.ts`:
```typescript
import { getMindmapData } from "@/server/api/services/mindmap";

.get("/slug/:slug/mindmap", async ({ params, query }) => {
  const data = await getMindmapData(params.slug, query.path);
  return { success: true, data: data });
})
```

**Step 3: Test endpoint**

Run: `curl http://localhost:3001/api/courses/slug/bct-301/mindmap`
Expected: JSON with nodes and edges

**Step 4: Commit**

```bash
git add src/server/api/services/mindmap.ts src/server/api/routes/courses/public.ts
git commit -m "feat(course-explorer): add mindmap data endpoint"
```

---

### Task 7: Implement Unit CRUD Routes

**Files:**
- Create: `src/server/api/routes/units/index.ts`
- Create: `src/server/api/routes/units/public.ts`
- Create: `src/server/api/routes/units/admin.ts`

**Step 1: Create public unit routes**

Create `src/server/api/routes/units/public.ts`:
```typescript
import { Elysia } from "elysia";
import { db } from "@/server/db";
import { courseUnits } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const publicUnitRoutes = new Elysia({ prefix: "/units" })
  .get("/slug/:slug", async ({ params }) => {
    const unit = await db.query.courseUnits.findFirst({
      where: eq(courseUnits.slug, params.slug),
      with: {
        course: true,
        topics: {
          where: (topics, { eq }) => eq(topics.isActive, true),
          with: {
            resources: true,
          },
        },
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    return { success: true, data: unit };
  })
  .get("/slug/:slug/topics", async ({ params }) => {
    const unit = await db.query.courseUnits.findFirst({
      where: eq(courseUnits.slug, params.slug),
      with: {
        topics: {
          where: (topics, { eq }) => eq(topics.isActive, true),
          orderBy: (topics, { asc }) => asc(topics.sortOrder),
        },
      },
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    return { success: true, data: unit.topics };
  });
```

**Step 2: Create admin unit routes**

Create `src/server/api/routes/units/admin.ts`:
```typescript
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { courseUnits } from "@/server/db/schema";
import { authenticateServer } from "@/server/auth";

export const adminUnitRoutes = new Elysia({ prefix: "/units/admin" })
  .use(authenticateServer)
  .get("/", async () => {
    const units = await db.query.courseUnits.findMany();
    return { success: true, data: units };
  })
  .post("/", async ({ body }) => {
    const unit = {
      id: crypto.randomUUID(),
      slug: body.slug,
      courseId: body.courseId,
      name: body.name,
      description: body.description,
      unitType: body.unitType,
      sortOrder: body.sortOrder || 0,
    };

    await db.insert(courseUnits).values(unit);

    return { success: true, data: unit };
  }, {
    body: t.Object({
      slug: t.String(),
      courseId: t.String(),
      name: t.String(),
      description: t.Optional(t.String()),
      unitType: t.Union([t.Literal("module"), t.Literal("chapter")]),
      sortOrder: t.Optional(t.Number()),
    }),
  })
  .patch("/:id", async ({ params, body }) => {
    await db.update(courseUnits)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(courseUnits.id, params.id));

    return { success: true };
  })
  .delete("/:id", async ({ params }) => {
    await db.update(courseUnits)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(courseUnits.id, params.id));

    return { success: true };
  });
```

**Step 3: Register routes**

Modify `src/server/api/index.ts`:
```typescript
import { publicUnitRoutes } from "./routes/units/public";
import { adminUnitRoutes } from "./routes/units/admin";

app.use(publicUnitRoutes);
app.use(adminUnitRoutes);
```

**Step 4: Test CRUD operations**

Run: `curl -X POST http://localhost:3001/api/units/admin -d '{...}'`
Expected: Created unit response

**Step 5: Commit**

```bash
git add src/server/api/routes/units/
git commit -m "feat(course-explorer): add unit CRUD routes"
```

---

### Task 8: Implement Topic CRUD Routes

**Files:**
- Create: `src/server/api/routes/topics/index.ts`
- Create: `src/server/api/routes/topics/public.ts`
- Create: `src/server/api/routes/topics/admin.ts`

**Step 1: Create public topic routes**

Create `src/server/api/routes/topics/public.ts`:
```typescript
import { Elysia } from "elysia";
import { db } from "@/server/db";
import { courseTopics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const publicTopicRoutes = new Elysia({ prefix: "/topics" })
  .get("/slug/:slug", async ({ params }) => {
    const topic = await db.query.courseTopics.findFirst({
      where: eq(courseTopics.slug, params.slug),
      with: {
        unit: true,
        parentTopic: true,
        children: true,
        prerequisites: {
          with: {
            prerequisiteTopic: true,
          },
        },
        resources: {
          with: {
            resource: true,
          },
        },
      },
    });

    if (!topic) {
      throw new Error("Topic not found");
    }

    return { success: true, data: topic };
  })
  .post("/slug/:slug/view", async ({ params }) => {
    await db.update(courseTopics)
      .set({
        viewCount: sql`${courseTopics.viewCount} + 1`,
      })
      .where(eq(courseTopics.slug, params.slug));

    return { success: true };
  });
```

**Step 2: Create admin topic routes**

Create `src/server/api/routes/topics/admin.ts`:
```typescript
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { courseTopics, topicPrerequisites } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { authenticateServer } from "@/server/auth";

export const adminTopicRoutes = new Elysia({ prefix: "/topics/admin" })
  .use(authenticateServer)
  .get("/", async () => {
    const topics = await db.query.courseTopics.findMany({
      with: {
        unit: true,
        parentTopic: true,
      },
    });
    return { success: true, data: topics };
  })
  .post("/", async ({ body }) => {
    const topic = {
      id: crypto.randomUUID(),
      slug: body.slug,
      unitId: body.unitId,
      name: body.name,
      description: body.description,
      priorityLevel: body.priorityLevel,
      hours: body.hours || 0,
      weightage: body.weightage || 0,
      sortOrder: body.sortOrder || 0,
      parentTopicId: body.parentTopicId,
    };

    await db.insert(courseTopics).values(topic);

    return { success: true, data: topic };
  }, {
    body: t.Object({
      slug: t.String(),
      unitId: t.String(),
      name: t.String(),
      description: t.Optional(t.String()),
      priorityLevel: t.Union([
        t.Literal("core"),
        t.Literal("important"),
        t.Literal("optional"),
      ]),
      hours: t.Optional(t.Number()),
      weightage: t.Optional(t.Number()),
      sortOrder: t.Optional(t.Number()),
      parentTopicId: t.Optional(t.String()),
    }),
  })
  .patch("/:id", async ({ params, body }) => {
    await db.update(courseTopics)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(courseTopics.id, params.id));

    return { success: true };
  })
  .delete("/:id", async ({ params }) => {
    await db.update(courseTopics)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(courseTopics.id, params.id));

    return { success: true };
  })
  .post("/:id/prerequisites", async ({ params, body }) => {
    const prereq = {
      id: crypto.randomUUID(),
      topicId: params.id,
      prerequisiteTopicId: body.prerequisiteTopicId,
      dependencyType: body.dependencyType,
    };

    await db.insert(topicPrerequisites).values(prereq);

    return { success: true, data: prereq };
  }, {
    body: t.Object({
      prerequisiteTopicId: t.String(),
      dependencyType: t.Union([t.Literal("strong"), t.Literal("weak")]),
    }),
  })
  .delete("/:id/prerequisites/:prereqId", async ({ params }) => {
    await db.delete(topicPrerequisites)
      .where(
        eq(topicPrerequisites.id, params.prereqId)
      );

    return { success: true };
  });
```

**Step 3: Register routes**

Modify `src/server/api/index.ts`:
```typescript
import { publicTopicRoutes } from "./routes/topics/public";
import { adminTopicRoutes } from "./routes/topics/admin";

app.use(publicTopicRoutes);
app.use(adminTopicRoutes);
```

**Step 4: Commit**

```bash
git add src/server/api/routes/topics/
git commit -m "feat(course-explorer): add topic CRUD routes"
```

---

### Task 9: Implement Bulk Operations for AI Agents

**Files:**
- Create: `src/server/api/routes/courses/bulk.ts`
- Modify: `src/server/api/routes/courses/admin.ts`

**Step 1: Create bulk operations**

Create `src/server/api/routes/courses/bulk.ts`:
```typescript
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { courseUnits, courseTopics, topicResourceLinks } from "@/server/db/schema";
import { authenticateServer } from "@/server/auth";

export const bulkOperationsRoutes = new Elysia()
  .use(authenticateServer)
  .post("/courses/admin/:id/units/bulk", async ({ params, body }) => {
    const units = body.units.map((unit: any) => ({
      id: crypto.randomUUID(),
      courseId: params.id,
      ...unit,
    }));

    await db.insert(courseUnits).values(units);

    return { success: true, data: units };
  }, {
    body: t.Object({
      units: t.Array(t.Object({
        slug: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        unitType: t.Union([t.Literal("module"), t.Literal("chapter")]),
        sortOrder: t.Optional(t.Number()),
      })),
    }),
  })
  .post("/courses/admin/:id/topics/bulk", async ({ params, body }) => {
    const topics = body.topics.map((topic: any) => ({
      id: crypto.randomUUID(),
      ...topic,
    }));

    await db.insert(courseTopics).values(topics);

    return { success: true, data: topics };
  }, {
    body: t.Object({
      topics: t.Array(t.Object({
        slug: t.String(),
        unitId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        priorityLevel: t.Union([
          t.Literal("core"),
          t.Literal("important"),
          t.Literal("optional"),
        ]),
        hours: t.Optional(t.Number()),
        weightage: t.Optional(t.Number()),
        sortOrder: t.Optional(t.Number()),
        parentTopicId: t.Optional(t.String()),
      })),
    }),
  })
  .post("/prerequisites/admin/bulk", async ({ body }) => {
    const prereqs = body.prerequisites.map((prereq: any) => ({
      id: crypto.randomUUID(),
      ...prereq,
    }));

    await db.insert(topicPrerequisites).values(prereqs);

    return { success: true, data: prereqs };
  }, {
    body: t.Object({
      prerequisites: t.Array(t.Object({
        topicId: t.String(),
        prerequisiteTopicId: t.String(),
        dependencyType: t.Union([t.Literal("strong"), t.Literal("weak")]),
      })),
    }),
  })
  .post("/courses/admin/:id/resources/bulk", async ({ body }) => {
    const links = body.links.map((link: any) => ({
      id: crypto.randomUUID(),
      ...link,
    }));

    await db.insert(topicResourceLinks).values(links);

    return { success: true, data: links };
  }, {
    body: t.Object({
      links: t.Array(t.Object({
        topicId: t.String(),
        resourceId: t.String(),
        relevance: t.Union([
          t.Literal("primary"),
          t.Literal("supplementary"),
          t.Literal("practice"),
        ]),
        sortOrder: t.Optional(t.Number()),
      })),
    }),
  });
```

**Step 2: Register bulk routes**

Modify `src/server/api/index.ts`:
```typescript
import { bulkOperationsRoutes } from "./routes/courses/bulk";
app.use(bulkOperationsRoutes);
```

**Step 3: Commit**

```bash
git add src/server/api/routes/courses/bulk.ts
git commit -m "feat(course-explorer): add bulk operations for AI agents"
```

---

## Phase 3: Frontend Mindmap Component

### Task 10: Select and Setup Mindmap Library

**Files:**
- Modify: `package.json`
- Create: `src/components/course-explorer/MindmapView.tsx`

**Step 1: Install React Flow**

Run: `bun add reactflow`

**Step 2: Create base mindmap component**

Create `src/components/course-explorer/MindmapView.tsx`:
```typescript
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

interface MindmapViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

const nodeTypes: NodeTypes = {};

export function MindmapView({ nodes: initialNodes, edges: initialEdges, onNodeClick }: MindmapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const styledNodes = useMemo(() =>
    nodes.map((node) => ({
      ...node,
      style: getNodeStyle(node.data),
    })),
    [nodes]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function getNodeStyle(data: any) {
  const priorityColors = {
    core: "#ef4444",
    important: "#f97316",
    optional: "#6b7280",
  };

  const color = priorityColors[data.priority] || "#6b7280";
  const size = data.level === 1 ? 60 : data.level === 2 ? 50 : 40;

  return {
    background: color,
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
  };
}
```

**Step 3: Commit**

```bash
git add package.json src/components/course-explorer/MindmapView.tsx
git commit -m "feat(course-explorer): add base mindmap component with React Flow"
```

---

### Task 11: Implement Study Path Filtering

**Files:**
- Modify: `src/components/course-explorer/MindmapView.tsx`
- Create: `src/components/course-explorer/useStudyPath.ts`

**Step 1: Create study path hook**

Create `src/components/course-explorer/useStudyPath.ts`:
```typescript
import { useMemo } from "react";
import { Node, Edge } from "reactflow";

export function useStudyPath(
  nodes: Node[],
  edges: Edge[],
  path?: string
) {
  return useMemo(() => {
    if (!path) return { filteredNodes: nodes, filteredEdges: edges };

    const filteredNodes = filterNodesByPath(nodes, path);
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { filteredNodes, filteredEdges };
  }, [nodes, edges, path]);
}

function filterNodesByPath(nodes: Node[], path: string): Node[] {
  switch (path) {
    case "exam-prep":
      return nodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: n.data.weightage > 0 ? 1 : 0.3,
        },
      }));

    case "minimum":
      return nodes
        .filter((n) => n.data.priority === "core")
        .map((n) => ({ ...n, style: { ...n.style, opacity: 1 } }));

    case "mastery":
      return nodes.map((n) => ({
        ...n,
        style: { ...n.style, opacity: 1 },
      }));

    default:
      return nodes;
  }
}
```

**Step 2: Update mindmap to use path filtering**

Modify `src/components/course-explorer/MindmapView.tsx`:
```typescript
import { useStudyPath } from "./useStudyPath";

interface MindmapViewProps {
  nodes: Node[];
  edges: Edge[];
  path?: string;
  onNodeClick?: (node: Node) => void;
}

export function MindmapView({ nodes, edges, path, onNodeClick }: MindmapViewProps) {
  const { filteredNodes, filteredEdges } = useStudyPath(nodes, edges, path);

  const [internalNodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [internalEdges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Update when path changes
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  // ... rest of component
}
```

**Step 3: Commit**

```bash
git add src/components/course-explorer/useStudyPath.ts src/components/course-explorer/MindmapView.tsx
git commit -m "feat(course-explorer): add study path filtering"
```

---

### Task 12: Create Contextual Sources Panel

**Files:**
- Create: `src/components/course-explorer/SourcesPanel.tsx`

**Step 1: Create sources panel component**

Create `src/components/course-explorer/SourcesPanel.tsx`:
```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, Video, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  relevance: "primary" | "supplementary" | "practice";
}

interface Topic {
  id: string;
  name: string;
  description: string;
  resources: Array<{ resource: Resource }>;
  prerequisites: Array<{ prerequisiteTopic: { id: string; name: string } }>;
}

interface SourcesPanelProps {
  topic: Topic | null;
  isLoading?: boolean;
}

export function SourcesPanel({ topic, isLoading }: SourcesPanelProps) {
  if (isLoading) {
    return <SourcesPanelSkeleton />;
  }

  if (!topic) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Select a topic to view resources</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="mb-2 text-2xl font-bold">{topic.name}</h2>
          {topic.description && (
            <p className="mb-6 text-gray-600">{topic.description}</p>
          )}

          {topic.prerequisites.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-700">Prerequisites</h3>
              <ul className="space-y-2">
                {topic.prerequisites.map((prereq) => (
                  <li
                    key={prereq.prerequisiteTopic.id}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <span className="text-blue-600">→</span>
                    {prereq.prerequisiteTopic.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="mb-3 font-semibold text-gray-700">Resources</h3>
          <div className="space-y-3">
            {topic.resources.map(({ resource }) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const icons = {
    syllabus: BookOpen,
    notes: FileText,
    video: Video,
    default: ExternalLink,
  };

  const Icon = icons[resource.type as keyof typeof icons] || icons.default;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{resource.title}</h4>
          {resource.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {resource.description}
            </p>
          )}
          <span className="mt-2 inline-block text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-600">
            {resource.relevance}
          </span>
        </div>
      </div>
    </a>
  );
}

function SourcesPanelSkeleton() {
  return (
    <div className="h-full p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/course-explorer/SourcesPanel.tsx
git commit -m "feat(course-explorer): add contextual sources panel"
```

---

### Task 13: Create Main Course Explorer Page

**Files:**
- Create: `src/app/course-explorer/[slug]/page.tsx`
- Create: `src/components/course-explorer/CourseExplorer.tsx`

**Step 1: Create main explorer component**

Create `src/components/course-explorer/CourseExplorer.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MindmapView } from "./MindmapView";
import { SourcesPanel } from "./SourcesPanel";
import { Loader2 } from "lucide-react";

interface CourseExplorerProps {
  courseSlug: string;
}

export function CourseExplorer({ courseSlug }: CourseExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: mindmapData, isLoading } = useQuery({
    queryKey: ["mindmap", courseSlug, selectedPath],
    queryFn: async () => {
      const path = selectedPath ? `?path=${selectedPath}` : "";
      const res = await fetch(`/api/courses/slug/${courseSlug}/mindmap${path}`);
      const json = await res.json();
      return json.data;
    },
  });

  const { data: topicData } = useQuery({
    queryKey: ["topic", selectedNode?.id],
    queryFn: async () => {
      if (!selectedNode) return null;
      const res = await fetch(`/api/topics/slug/${selectedNode.slug}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!selectedNode,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const nodes = mindmapData.nodes.map((n: any) => ({
    id: n.id,
    data: n,
    position: { x: n.x || 0, y: n.y || 0 },
  }));

  const edges = mindmapData.edges.map((e: any) => ({
    id: `${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    type: e.type === "strong" ? "smoothstep" : "default",
    animated: e.type === "strong",
    style: { stroke: e.type === "strong" ? "#ef4444" : "#94a3b8" },
  }));

  return (
    <div className="flex h-screen">
      {/* Study Path Selector */}
      <div className="w-64 border-r p-4">
        <h2 className="mb-4 font-semibold">Study Paths</h2>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedPath(undefined)}
            className={`w-full text-left px-3 py-2 rounded ${
              !selectedPath ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            All Topics
          </button>
          <button
            onClick={() => setSelectedPath("exam-prep")}
            className={`w-full text-left px-3 py-2 rounded ${
              selectedPath === "exam-prep" ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            Exam Prep
          </button>
          <button
            onClick={() => setSelectedPath("minimum")}
            className={`w-full text-left px-3 py-2 rounded ${
              selectedPath === "minimum" ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            Minimum Passing
          </button>
          <button
            onClick={() => setSelectedPath("mastery")}
            className={`w-full text-left px-3 py-2 rounded ${
              selectedPath === "mastery" ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            Concept Mastery
          </button>
        </div>

        <div className="mt-8">
          <a
            href={`/study-planner?course=${courseSlug}`}
            className="block w-full text-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Create Study Plan
          </a>
        </div>
      </div>

      {/* Mindmap */}
      <div className="flex-1">
        <MindmapView
          nodes={nodes}
          edges={edges}
          path={selectedPath}
          onNodeClick={setSelectedNode}
        />
      </div>

      {/* Sources Panel */}
      <div className="w-96 border-l">
        <SourcesPanel topic={topicData} isLoading={!topicData && !!selectedNode} />
      </div>
    </div>
  );
}
```

**Step 2: Create page route**

Create `src/app/course-explorer/[slug]/page.tsx`:
```typescript
import { CourseExplorer } from "@/components/course-explorer/CourseExplorer";

export default function CourseExplorerPage({
  params,
}: {
  params: { slug: string };
}) {
  return <CourseExplorer courseSlug={params.slug} />;
}
```

**Step 3: Update landing page link**

Modify `src/components/landing/features.tsx`:
Update the Course Explorer feature card:
```typescript
{
  icon: BookOpen,
  title: "Course Explorer",
  description: "Understand course structure, topics, and relationships.",
  href: "/course-explorer/bct-301", // or dynamic based on available courses
},
```

**Step 4: Commit**

```bash
git add src/components/course-explorer/CourseExplorer.tsx src/app/course-explorer/
git commit -m "feat(course-explorer): add main course explorer page"
```

---

## Phase 4: Instructor Tools

### Task 14: Create Instructor Dashboard

**Files:**
- Create: `src/app/instructor/courses/page.tsx`
- Create: `src/components/instructor/CourseManagement.tsx`

**Step 1: Create course management component**

Create `src/components/instructor/CourseManagement.tsx`:
```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Eye } from "lucide-react";
import Link from "next/link";

export function CourseManagement() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/admin");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Course Management</h1>
        <Link
          href="/instructor/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      <div className="grid gap-4">
        {courses.map((course: any) => (
          <div key={course.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{course.name}</h2>
                <p className="text-gray-600">{course.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {course.units?.length || 0} units
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/instructor/courses/${course.id}/edit`}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <Link
                  href={`/course-explorer/${course.slug}`}
                  className="p-2 hover:bg-gray-100 rounded"
                  target="_blank"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create instructor page**

Create `src/app/instructor/courses/page.tsx`:
```typescript
import { CourseManagement } from "@/components/instructor/CourseManagement";

export default function InstructorCoursesPage() {
  return <CourseManagement />;
}
```

**Step 3: Commit**

```bash
git add src/app/instructor/courses/page.tsx src/components/instructor/CourseManagement.tsx
git commit -m "feat(course-explorer): add instructor course dashboard"
```

---

### Task 15: Create Course Structure Editor

**Files:**
- Create: `src/app/instructor/courses/[id]/edit/page.tsx`
- Create: `src/components/instructor/CourseEditor.tsx`

**Step 1: Create course editor**

Create `src/components/instructor/CourseEditor.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronRight } from "lucide-react";

export function CourseEditor({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/admin/${courseId}`);
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Edit Course: {course.name}</h1>

      <div className="space-y-4">
        {course.units?.map((unit: any) => (
          <UnitTree
            key={unit.id}
            unit={unit}
            isExpanded={expandedUnits.has(unit.id)}
            onToggle={() => {
              const newExpanded = new Set(expandedUnits);
              if (newExpanded.has(unit.id)) {
                newExpanded.delete(unit.id);
              } else {
                newExpanded.add(unit.id);
              }
              setExpandedUnits(newExpanded);
            }}
          />
        ))}

        <button className="flex items-center gap-2 text-primary hover:underline">
          <Plus className="h-4 w-4" />
          Add Unit
        </button>
      </div>
    </div>
  );
}

function UnitTree({ unit, isExpanded, onToggle }: any) {
  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
          <span className="font-semibold">{unit.name}</span>
          <span className="text-sm text-gray-500">({unit.topics?.length || 0} topics)</span>
        </div>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus className="h-4 w-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 pl-8 space-y-2">
          {unit.topics?.map((topic: any) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
          <button className="text-sm text-primary hover:underline">
            + Add Topic
          </button>
        </div>
      )}
    </div>
  );
}

function TopicItem({ topic }: { topic: any }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
      <span>{topic.name}</span>
      <div className="flex gap-2">
        <button className="text-sm text-blue-600 hover:underline">
          Edit
        </button>
        <button className="text-sm text-red-600 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/instructor/CourseEditor.tsx
git commit -m "feat(course-explorer): add course structure editor"
```

---

## Phase 5: Testing & Documentation

### Task 16: Add E2E Tests for Course Explorer

**Files:**
- Create: `test/e2e/course-explorer.spec.ts`

**Step 1: Write E2E test**

Create `test/e2e/course-explorer.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Course Explorer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/course-explorer/bct-301");
  });

  test("displays mindmap visualization", async ({ page }) => {
    await expect(page.locator(".react-flow")).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(
      // Expect topic nodes to be rendered
      { greaterThan: 0 }
    );
  });

  test("filters by study path", async ({ page }) => {
    // Select exam prep path
    await page.click('button:has-text("Exam Prep")');

    // Verify nodes are filtered
    const visibleNodes = await page.locator(".react-flow__node").count();
    expect(visibleNodes).toBeGreaterThan(0);
  });

  test("shows sources panel on topic click", async ({ page }) => {
    // Click first topic node
    await page.click(".react-flow__node:first-child");

    // Verify sources panel appears
    await expect(page.locator("text=Resources")).toBeVisible();
    await expect(page.locator("text=Prerequisites")).toBeVisible();
  });

  test("navigates to study planner", async ({ page }) => {
    const studyPlanButton = page.locator('a:has-text("Create Study Plan")');
    await studyPlanButton.click();

    await expect(page).toHaveURL(/\/study-planner/);
  });
});
```

**Step 2: Run tests**

Run: `bun test:e2e test/e2e/course-explorer.spec.ts`

**Step 3: Commit**

```bash
git add test/e2e/course-explorer.spec.ts
git commit -m "test(course-explorer): add E2E tests"
```

---

### Task 17: Write Documentation

**Files:**
- Create: `docs/course-explorer.md`
- Create: `docs/plans/2026-02-01-course-explorer-design.md`

**Step 1: Create feature documentation**

Create `docs/course-explorer.md`:
```markdown
# Course Explorer

Interactive course exploration tool with mindmap visualization and curated study paths.

## Features

- **Mindmap Visualization**: Interactive graph showing topic relationships
- **Study Paths**: Curated learning paths (Exam Prep, Concept Mastery, etc.)
- **Contextual Resources**: Automatic resource display based on selected topic
- **Prerequisite Tracking**: Visual dependencies between topics
- **Instructor Tools**: Course structure management with AI-assisted organization

## User Guide

### For Students

1. Navigate to `/course-explorer/[course-slug]`
2. Select a study path from the left sidebar
3. Click topics in the mindmap to view resources
4. Check prerequisites before starting new topics
5. Click "Create Study Plan" to integrate with Study Planner

### For Instructors

1. Navigate to `/instructor/courses`
2. Select a course to edit
3. Add units and topics
4. Define prerequisite relationships
5. Link resources from the library
6. Use Claude Code with MCP tools for AI-assisted structuring

## API Reference

See implementation plan for full API documentation.

## Integration with Study Planner

Course Explorer and Study Planner are decoupled but linkable:
- Course Explorer helps students understand *what* to study
- Study Planner helps students schedule *when* to study
- "Create Study Plan" button passes selected topics to Study Planner
```

**Step 2: Create design document**

Create `docs/plans/2026-02-01-course-explorer-design.md` with all design sections from brainstorming session.

**Step 3: Commit**

```bash
git add docs/course-explorer.md docs/plans/2026-02-01-course-explorer-design.md
git commit -m "docs(course-explorer): add feature documentation"
```

---

## Task 18: Final Integration & Polish

**Files:**
- Modify: `src/components/landing/features.tsx`
- Modify: `src/lib/navigation.ts` (if exists)

**Step 1: Update navigation**

Add Course Explorer link to main navigation.

**Step 2: Add loading states**

Ensure all components have proper loading and error states.

**Step 3: Add error boundaries**

Wrap Course Explorer in error boundary.

**Step 4: Accessibility audit**

Ensure keyboard navigation works for mindmap.
Add ARIA labels to interactive elements.

**Step 5: Performance optimization**

Add React.memo to expensive components.
Implement virtualization for large topic lists.

**Step 6: Final commit**

```bash
git add .
git commit -m "feat(course-explorer): final integration and polish"
```

---

## Summary

This plan implements the Course Explorer feature in 18 tasks across 5 phases:

1. **Database Schema** (Tasks 1-4): Units, topics, prerequisites, resource links, tags
2. **Backend API** (Tasks 5-9): CRUD routes, mindmap data, bulk operations
3. **Frontend Mindmap** (Tasks 10-13): React Flow visualization, study paths, sources panel
4. **Instructor Tools** (Tasks 14-15): Course management dashboard, structure editor
5. **Testing & Docs** (Tasks 16-18): E2E tests, documentation, final polish

**Total estimated implementation:** ~2-3 days for an experienced developer following TDD.

**Dependencies:**
- @superpowers:executing-plans - For task-by-task execution
- @tdd-workflow - For test-driven development
- @frontend-patterns - For React/Next.js best practices
- @backend-patterns - For API architecture
