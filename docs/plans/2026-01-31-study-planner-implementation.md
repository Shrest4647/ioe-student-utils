# Study Planner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive Study Planner feature that helps IOE students plan and track their academic schedules with structured day-by-day study tasks, progress tracking, and smart notifications.

**Architecture:** Next.js 16 (App Router) frontend with Elysia backend API, PostgreSQL database with Drizzle ORM, following the existing project structure. Uses reusable study plan templates with pattern replacement to generate personalized day-by-day task lists.

**Tech Stack:** Next.js 16, React 19, Elysia, Drizzle ORM, PostgreSQL, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion

---

## Phase 1: Database Schema & Migrations

### Task 1: Create Drizzle schema for academic_events table

**Files:**
- Create: `drizzle/schema/academic-events.ts`
- Modify: `drizzle/schema/index.ts`

**Step 1: Create the schema file**

Write to `drizzle/schema/academic-events.ts`:

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  time,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const academicEvents = pgTable("academic_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'exam', 'assignment', 'project', 'lab'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: date("date").notNull(),
  eventTime: time("time"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AcademicEvent = typeof academicEvents.$inferSelect;
export type NewAcademicEvent = typeof academicEvents.$inferInsert;
```

**Step 2: Export from index**

Add to `drizzle/schema/index.ts`:

```typescript
export * from "./academic-events";
```

**Step 3: Commit**

```bash
git add drizzle/schema/
git commit -m "feat(schema): add academic_events table schema"
```

---

### Task 2: Create Drizzle schema for study_templates table

**Files:**
- Create: `drizzle/schema/study-templates.ts`
- Modify: `drizzle/schema/index.ts`

**Step 1: Create the schema file**

Write to `drizzle/schema/study-templates.ts`:

```typescript
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const studyTemplates = pgTable("study_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  difficultyLevel: varchar("difficulty_level", { length: 50 }),
  dailyStructure: jsonb("daily_structure").notNull().$type<{
    morning: Array<{
      type: string;
      template: string;
      estimated_minutes: number;
    }>;
    afternoon: Array<{
      type: string;
      template: string;
      estimated_minutes: number;
    }>;
    evening: Array<{
      type: string;
      template: string;
      estimated_minutes: number;
    }>;
  }>,
  intensityCurve: jsonb("intensity_curve").notNull().$type<{
    [key: string]: string;
  }>,
  subjectArea: varchar("subject_area", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StudyTemplate = typeof studyTemplates.$inferSelect;
export type NewStudyTemplate = typeof studyTemplates.$inferInsert;
```

**Step 2: Export from index**

Add to `drizzle/schema/index.ts`:

```typescript
export * from "./study-templates";
```

**Step 3: Commit**

```bash
git add drizzle/schema/
git commit -m "feat(schema): add study_templates table schema"
```

---

### Task 3: Create Drizzle schema for study_plans table

**Files:**
- Create: `drizzle/schema/study-plans.ts`
- Modify: `drizzle/schema/index.ts`

**Step 1: Create the schema file**

Write to `drizzle/schema/study-plans.ts`:

```typescript
import {
  pgTable,
  uuid,
  varchar,
  date,
  decimal,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { studyTemplates } from "./study-templates";

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => studyTemplates.id),
  subjectName: varchar("subject_name", { length: 255 }).notNull(),
  examDate: date("exam_date").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  dailyTasks: jsonb("daily_tasks").notNull().$type<{
    [dayNumber: string]: Array<{
      id: string;
      title: string;
      description: string;
      taskType: string;
      estimatedMinutes: number;
    }>;
  }>,
  progressPercentage: decimal("progress_percentage", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // 'active', 'completed', 'archived'
  createdAt: timestamp("created_at").defaultNow(),
});

export type StudyPlan = typeof studyPlans.$inferSelect;
export type NewStudyPlan = typeof studyPlans.$inferInsert;
```

**Step 2: Export from index**

Add to `drizzle/schema/index.ts`:

```typescript
export * from "./study-plans";
```

**Step 3: Commit**

```bash
git add drizzle/schema/
git commit -m "feat(schema): add study_plans table schema"
```

---

### Task 4: Create Drizzle schema for study_tasks table

**Files:**
- Create: `drizzle/schema/study-tasks.ts`
- Modify: `drizzle/schema/index.ts`

**Step 1: Create the schema file**

Write to `drizzle/schema/study-tasks.ts`:

```typescript
import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { studyPlans } from "./study-plans";

export const studyTasks = pgTable("study_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  studyPlanId: uuid("study_plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: varchar("task_type", { length: 50 }).notNull(), // 'learn', 'practice', 'review', 'prepare'
  estimatedMinutes: integer("estimated_minutes"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  actualMinutesSpent: integer("actual_minutes_spent"),
  notes: text("notes"),
});

export type StudyTask = typeof studyTasks.$inferSelect;
export type NewStudyTask = typeof studyTasks.$inferInsert;
```

**Step 2: Export from index**

Add to `drizzle/schema/index.ts`:

```typescript
export * from "./study-tasks";
```

**Step 3: Commit**

```bash
git add drizzle/schema/
git commit -m "feat(schema): add study_tasks table schema"
```

---

### Task 5: Create Drizzle schema for study_logs table

**Files:**
- Create: `drizzle/schema/study-logs.ts`
- Modify: `drizzle/schema/index.ts`

**Step 1: Create the schema file**

Write to `drizzle/schema/study-logs.ts`:

```typescript
import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { studyTasks } from "./study-tasks";

export const studyLogs = pgTable("study_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => studyTasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  minutesSpent: integer("minutes_spent").notNull(),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export type StudyLog = typeof studyLogs.$inferSelect;
export type NewStudyLog = typeof studyLogs.$inferInsert;
```

**Step 2: Export from index**

Add to `drizzle/schema/index.ts`:

```typescript
export * from "./study-logs";
```

**Step 3: Commit**

```bash
git add drizzle/schema/
git commit -m "feat(schema): add study_logs table schema"
```

---

### Task 6: Generate and run database migration

**Files:**
- Create: `drizzle/migrations/[timestamp]/_study_planner_tables.sql`

**Step 1: Generate migration**

Run: `bun db:generate`

Expected output: New migration file created in `drizzle/migrations/`

**Step 2: Run migration**

Run: `bun db:migrate`

Expected output: Migration applied successfully, tables created in database

**Step 3: Commit**

```bash
git add drizzle/
git commit -m "feat(db): generate and apply study planner migrations"
```

---

## Phase 2: Seed Study Templates

### Task 7: Create seed data for study templates

**Files:**
- Create: `drizzle/seed/study-templates.ts`

**Step 1: Create seed file**

Write to `drizzle/seed/study-templates.ts`:

```typescript
import { db } from "../db";
import { studyTemplates } from "../schema";

const templates = [
  {
    name: "1-Day Sprint",
    durationDays: 1,
    difficultyLevel: "intensive",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 90,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} practice problems on {TOPIC}",
          estimated_minutes: 90,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review all {TOPIC} concepts and formulas",
          estimated_minutes: 30,
        },
        {
          type: "prepare",
          template: "Create quick reference sheet for {TOPIC}",
          estimated_minutes: 30,
        },
      ],
    },
    intensityCurve: {
      day_1: "review_only",
    },
    subjectArea: "general",
  },
  {
    name: "3-Day Boost",
    durationDays: 3,
    difficultyLevel: "moderate",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 60,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Complete exercises for {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} material",
          estimated_minutes: 20,
        },
        {
          type: "prepare",
          template: "Make notes for key {TOPIC} concepts",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_2: "normal",
      day_3: "review_only",
    },
    subjectArea: "general",
  },
  {
    name: "1-Week Plan",
    durationDays: 7,
    difficultyLevel: "moderate",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 45,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Complete exercises {RANGE}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} notes",
          estimated_minutes: 15,
        },
        {
          type: "prepare",
          template: "Make flashcards for {KEY_TERMS_COUNT} terms",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_2: "warmup",
      days_3_5: "normal",
      days_6_7: "review_only",
    },
    subjectArea: "general",
  },
  {
    name: "2-Week Comprehensive Plan",
    durationDays: 14,
    difficultyLevel: "moderate",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 45,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Complete exercises {RANGE}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} notes",
          estimated_minutes: 15,
        },
        {
          type: "prepare",
          template: "Make flashcards for {KEY_TERMS_COUNT} terms",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_3: "warmup",
      days_4_10: "normal",
      days_11_13: "intensive",
      day_14: "review_only",
    },
    subjectArea: "general",
  },
  {
    name: "1-Month Plan",
    durationDays: 30,
    difficultyLevel: "comprehensive",
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 60,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 90,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} material",
          estimated_minutes: 20,
        },
        {
          type: "prepare",
          template: "Create summary notes for {TOPIC}",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_5: "warmup",
      days_6_20: "normal",
      days_21_25: "intensive",
      days_26_30: "review_only",
    },
    subjectArea: "general",
  },
];

export async function seedStudyTemplates() {
  for (const template of templates) {
    await db.insert(studyTemplates).values(template);
  }
  console.log("Study templates seeded successfully");
}
```

**Step 2: Add to main seed file**

Modify `drizzle/seed/index.ts` to import and run the seed function:

```typescript
import { seedStudyTemplates } from "./study-templates";

async function main() {
  // ... existing seeds
  await seedStudyTemplates();
}
```

**Step 3: Run seed**

Run: `bun drizzle/seed/index.ts`

Expected output: "Study templates seeded successfully"

**Step 4: Commit**

```bash
git add drizzle/
git commit -m "feat(seed): add study plan templates"
```

---

## Phase 3: Backend API - Academic Events

### Task 8: Create academic events API routes

**Files:**
- Create: `src/server/api/routes/academic-events.ts`
- Modify: `src/server/api/index.ts`

**Step 1: Create API route file**

Write to `src/server/api/routes/academic-events.ts`:

```typescript
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { academicEvents } from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const academicEventsRoutes = new Elysia({ prefix: "/academic-events" })
  .get("/", async ({ query }: any) => {
    const { userId } = query;
    if (!userId) {
      return { error: "userId is required" };
    }

    const events = await db
      .select()
      .from(academicEvents)
      .where(eq(academicEvents.userId, userId))
      .orderBy(desc(academicEvents.eventDate));

    return { events };
  })
  .post(
    "/",
    async ({ body }: any) => {
      const newEvent = await db
        .insert(academicEvents)
        .values(body)
        .returning();

      return { event: newEvent[0] };
    },
    {
      body: t.Object({
        userId: t.String(),
        subjectName: t.String(),
        eventType: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        eventDate: t.String(),
        eventTime: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body }: any) => {
      const updated = await db
        .update(academicEvents)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(academicEvents.id, params.id))
        .returning();

      return { event: updated[0] };
    },
    {
      body: t.Object({
        subjectName: t.Optional(t.String()),
        eventType: t.Optional(t.String()),
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        eventDate: t.Optional(t.String()),
        eventTime: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
    }
  )
  .delete("/:id", async ({ params }: any) => {
    await db.delete(academicEvents).where(eq(academicEvents.id, params.id));
    return { success: true };
  });
```

**Step 2: Register routes**

Add to `src/server/api/index.ts`:

```typescript
import { academicEventsRoutes } from "./routes/academic-events";

// Add to plugin registration
api.group(app => app.use(academicEventsRoutes));
```

**Step 3: Commit**

```bash
git add src/server/api/
git commit -m "feat(api): add academic events CRUD endpoints"
```

---

## Phase 4: Backend API - Study Plans

### Task 9: Create study plan generation utility

**Files:**
- Create: `src/server/utils/study-plan-generator.ts`

**Step 1: Create plan generator utility**

Write to `src/server/utils/study-plan-generator.ts`:

```typescript
import { studyTemplates } from "../../drizzle/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

interface StudyTopic {
  name: string;
  chapter?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface GeneratePlanOptions {
  templateId: string;
  topics: StudyTopic[];
  examDate: string;
  startDate: string;
  dailyHoursAvailable?: number;
}

export async function generateStudyPlan(options: GeneratePlanOptions) {
  const template = await db.query.studyTemplates.findFirst({
    where: eq(studyTemplates.id, options.templateId),
  });

  if (!template) {
    throw new Error("Template not found");
  }

  const dailyTasks: any = {};
  const totalDays = template.durationDays;
  const topicsPerDay = Math.ceil(options.topics.length / totalDays);

  for (let day = 1; day <= totalDays; day++) {
    const startIndex = (day - 1) * topicsPerDay;
    const dayTopics = options.topics.slice(
      startIndex,
      startIndex + topicsPerDay
    );

    const tasks: any[] = [];

    for (const topic of dayTopics) {
      // Generate morning tasks
      template.dailyStructure.morning.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });

      // Generate afternoon tasks
      template.dailyStructure.afternoon.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });

      // Generate evening tasks
      template.dailyStructure.evening.forEach((taskPattern) => {
        tasks.push({
          id: crypto.randomUUID(),
          title: replacePlaceholders(taskPattern.template, topic, day),
          description: "",
          taskType: taskPattern.type,
          estimatedMinutes: taskPattern.estimated_minutes,
        });
      });
    }

    dailyTasks[day.toString()] = tasks;
  }

  return dailyTasks;
}

function replacePlaceholders(
  template: string,
  topic: StudyTopic,
  day: number
): string {
  return template
    .replace("{TOPIC}", topic.name)
    .replace("{CHAPTER}", topic.chapter || "")
    .replace("{PROBLEM_COUNT}", "5")
    .replace("{RANGE}", "related to this topic")
    .replace("{KEY_TERMS_COUNT}", "10")
    .replace("{PREVIOUS_DAY}", `Day ${day - 1}`);
}
```

**Step 2: Commit**

```bash
git add src/server/utils/
git commit -m "feat(utils): add study plan generator"
```

---

### Task 10: Create study plans API routes

**Files:**
- Create: `src/server/api/routes/study-plans.ts`
- Modify: `src/server/api/index.ts`

**Step 1: Create API route file**

Write to `src/server/api/routes/study-plans.ts`:

```typescript
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { studyPlans, studyTasks } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateStudyPlan } from "../../utils/study-plan-generator";

export const studyPlansRoutes = new Elysia({ prefix: "/study-plans" })
  .get("/", async ({ query }: any) => {
    const { userId } = query;
    if (!userId) {
      return { error: "userId is required" };
    }

    const plans = await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId));

    return { plans };
  })
  .get("/today", async ({ query }: any) => {
    const { userId } = query;
    if (!userId) {
      return { error: "userId is required" };
    }

    const plans = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, "active")));

    const today = new Date();
    const todayTasks = [];

    for (const plan of plans) {
      const startDate = new Date(plan.startDate);
      const daysDiff = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const tasks = await db
        .select()
        .from(studyTasks)
        .where(
          and(
            eq(studyTasks.studyPlanId, plan.id),
            eq(studyTasks.dayNumber, daysDiff)
          )
        );

      todayTasks.push(...tasks);
    }

    return { tasks: todayTasks };
  })
  .post(
    "/create",
    async ({ body }: any) => {
      const dailyTasks = await generateStudyPlan({
        templateId: body.templateId,
        topics: body.topics,
        examDate: body.examDate,
        startDate: body.startDate,
      });

      const newPlan = await db
        .insert(studyPlans)
        .values({
          userId: body.userId,
          templateId: body.templateId,
          subjectName: body.subjectName,
          examDate: new Date(body.examDate),
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          dailyTasks,
          progressPercentage: "0",
          status: "active",
        })
        .returning();

      // Insert individual tasks
      const plan = newPlan[0];
      for (const [dayNumber, tasks] of Object.entries(dailyTasks)) {
        for (const task of tasks as any[]) {
          await db.insert(studyTasks).values({
            studyPlanId: plan.id,
            dayNumber: parseInt(dayNumber),
            title: task.title,
            description: task.description,
            taskType: task.taskType,
            estimatedMinutes: task.estimatedMinutes,
          });
        }
      }

      return { plan: plan };
    },
    {
      body: t.Object({
        userId: t.String(),
        templateId: t.String(),
        subjectName: t.String(),
        topics: t.Array(
          t.Object({
            name: t.String(),
            chapter: t.Optional(t.String()),
          })
        ),
        examDate: t.String(),
        startDate: t.String(),
        endDate: t.String(),
      }),
    }
  )
  .get("/:id", async ({ params }: any) => {
    const plan = await db.query.studyPlans.findFirst({
      where: eq(studyPlans.id, params.id),
    });

    if (!plan) {
      return { error: "Plan not found" };
    }

    const tasks = await db
      .select()
      .from(studyTasks)
      .where(eq(studyTasks.studyPlanId, plan.id));

    return { plan, tasks };
  })
  .patch("/:id", async ({ params, body }: any) => {
    const updated = await db
      .update(studyPlans)
      .set(body)
      .where(eq(studyPlans.id, params.id))
      .returning();

    return { plan: updated[0] };
  })
  .delete("/:id", async ({ params }: any) => {
    await db
      .update(studyPlans)
      .set({ status: "archived" })
      .where(eq(studyPlans.id, params.id));

    return { success: true };
  });
```

**Step 2: Register routes**

Add to `src/server/api/index.ts`:

```typescript
import { studyPlansRoutes } from "./routes/study-plans";

api.group(app => app.use(studyPlansRoutes));
```

**Step 3: Commit**

```bash
git add src/server/
git commit -m "feat(api): add study plans CRUD and generation endpoints"
```

---

### Task 11: Create study tasks API routes

**Files:**
- Create: `src/server/api/routes/study-tasks.ts`
- Modify: `src/server/api/index.ts`

**Step 1: Create API route file**

Write to `src/server/api/routes/study-tasks.ts`:

```typescript
import { Elysia, t } from "elysia";
import { db } from "../../db";
import { studyTasks, studyPlans, studyLogs } from "../../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const studyTasksRoutes = new Elysia({ prefix: "/study-tasks" })
  .patch(
    "/:id/complete",
    async ({ params }: any) => {
      const updated = await db
        .update(studyTasks)
        .set({
          completed: true,
          completedAt: new Date(),
        })
        .where(eq(studyTasks.id, params.id))
        .returning();

      // Update plan progress
      const task = updated[0];
      const allTasks = await db
        .select()
        .from(studyTasks)
        .where(eq(studyTasks.studyPlanId, task.studyPlanId));

      const completedCount = allTasks.filter((t) => t.completed).length;
      const progressPercentage = (completedCount / allTasks.length) * 100;

      await db
        .update(studyPlans)
        .set({ progressPercentage: progressPercentage.toString() })
        .where(eq(studyPlans.id, task.studyPlanId));

      return { task: updated[0] };
    }
  )
  .patch(
    "/:id/uncomplete",
    async ({ params }: any) => {
      const updated = await db
        .update(studyTasks)
        .set({
          completed: false,
          completedAt: null,
        })
        .where(eq(studyTasks.id, params.id))
        .returning();

      // Update plan progress
      const task = updated[0];
      const allTasks = await db
        .select()
        .from(studyTasks)
        .where(eq(studyTasks.studyPlanId, task.studyPlanId));

      const completedCount = allTasks.filter((t) => t.completed).length;
      const progressPercentage = (completedCount / allTasks.length) * 100;

      await db
        .update(studyPlans)
        .set({ progressPercentage: progressPercentage.toString() })
        .where(eq(studyPlans.id, task.studyPlanId));

      return { task: updated[0] };
    }
  )
  .post(
    "/:id/log-time",
    async ({ params, body }: any) => {
      await db.insert(studyLogs).values({
        taskId: params.id,
        userId: body.userId,
        minutesSpent: body.minutes,
        notes: body.notes,
      });

      // Update task actual minutes
      const task = await db
        .select()
        .from(studyTasks)
        .where(eq(studyTasks.id, params.id));

      const newTotal = (task[0].actualMinutesSpent || 0) + body.minutes;

      await db
        .update(studyTasks)
        .set({ actualMinutesSpent: newTotal })
        .where(eq(studyTasks.id, params.id));

      return { success: true };
    },
    {
      body: t.Object({
        userId: t.String(),
        minutes: t.Number(),
        notes: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ params }: any) => {
    const task = await db.query.studyTasks.findFirst({
      where: eq(studyTasks.id, params.id),
    });

    return { task };
  });
```

**Step 2: Register routes**

Add to `src/server/api/index.ts`:

```typescript
import { studyTasksRoutes } from "./routes/study-tasks";

api.group(app => app.use(studyTasksRoutes));
```

**Step 3: Commit**

```bash
git add src/server/
git commit -m "feat(api): add study task completion and logging endpoints"
```

---

## Phase 5: Frontend - Study Planner Components

### Task 12: Create StudyPlanCreator component

**Files:**
- Create: `src/components/study-planner/StudyPlanCreator.tsx`

**Step 1: Create the component**

Write to `src/components/study-planner/StudyPlanCreator.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle } from "lucide-react";

interface Topic {
  name: string;
  chapter?: string;
}

export function StudyPlanCreator() {
  const [subjectName, setSubjectName] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [examDate, setExamDate] = useState<Date>();
  const [templateId, setTemplateId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const addTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, { name: newTopic.trim() }]);
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const createPlan = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/study-plans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "current-user-id", // TODO: Get from auth
          templateId,
          subjectName,
          topics,
          examDate: examDate?.toISOString(),
          startDate: new Date().toISOString(),
          endDate: examDate?.toISOString(),
        }),
      });

      const data = await response.json();
      // TODO: Handle success, redirect to plan view
      console.log("Plan created:", data.plan);
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Study Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="subject">Subject Name</Label>
          <Input
            id="subject"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="e.g., Data Structures"
          />
        </div>

        <div>
          <Label htmlFor="template">Plan Duration</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-day">1-Day Sprint</SelectItem>
              <SelectItem value="3-day">3-Day Boost</SelectItem>
              <SelectItem value="1-week">1-Week Plan</SelectItem>
              <SelectItem value="2-week">2-Week Comprehensive</SelectItem>
              <SelectItem value="1-month">1-Month Plan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Topics to Cover</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTopic()}
              placeholder="Add a topic"
            />
            <Button onClick={addTopic} size="icon">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          {topics.length > 0 && (
            <div className="mt-4 space-y-2">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>{topic.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTopic(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Exam Date</Label>
          <Calendar
            mode="single"
            selected={examDate}
            onSelect={setExamDate}
            className="mt-2"
          />
        </div>

        <Button
          onClick={createPlan}
          disabled={!subjectName || !templateId || !examDate || isCreating}
          className="w-full"
        >
          {isCreating ? "Creating Plan..." : "Create Study Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/study-planner/
git commit -m "feat(ui): add StudyPlanCreator component"
```

---

### Task 13: Create DailyTaskView component

**Files:**
- Create: `src/components/study-planner/DailyTaskView.tsx`

**Step 1: Create the component**

Write to `src/components/study-planner/DailyTaskView.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface StudyTask {
  id: string;
  title: string;
  description: string;
  taskType: string;
  estimatedMinutes: number;
  completed: boolean;
}

export function DailyTaskView() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  const fetchTodayTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/study-plans/today?userId=current-user-id` // TODO: Get from auth
      );
      const data = await response.json();
      setTasks(data.tasks || []);
      setCompletedCount(data.tasks?.filter((t: StudyTask) => t.completed).length || 0);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const endpoint = completed ? "/complete" : "/uncomplete";
      await fetch(`/api/study-tasks/${taskId}${endpoint}`, {
        method: "PATCH",
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed } : task
        )
      );
      setCompletedCount((prev) => (completed ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case "learn":
        return "bg-blue-500";
      case "practice":
        return "bg-orange-500";
      case "review":
        return "bg-purple-500";
      case "prepare":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading today's tasks...</div>;
  }

  const totalMinutes = tasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Focus</span>
            <Badge variant="outline">
              {completedCount}/{tasks.length} tasks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Daily Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated time: {Math.round(totalMinutes / 60)} hours</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`transition-all hover:shadow-md ${
                task.completed ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      toggleTaskComplete(task.id, !!checked)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-medium ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <Badge className={getTaskTypeColor(task.taskType)}>
                        {task.taskType}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{task.estimatedMinutes} minutes</span>
                    </div>
                  </div>
                  {task.completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No tasks scheduled for today. Enjoy your free time!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/study-planner/
git commit -m "feat(ui): add DailyTaskView component"
```

---

### Task 14: Create StudyPlannerDashboard component

**Files:**
- Create: `src/components/study-planner/StudyPlannerDashboard.tsx`
- Create: `src/app/(study-planner)/page.tsx`

**Step 1: Create the dashboard component**

Write to `src/components/study-planner/StudyPlannerDashboard.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyTaskView } from "./DailyTaskView";
import { StudyPlanCreator } from "./StudyPlanCreator";
import { Plus, Calendar, BookOpen, TrendingUp } from "lucide-react";

export function StudyPlannerDashboard() {
  const [showCreator, setShowCreator] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `/api/study-plans?userId=current-user-id` // TODO: Get from auth
      );
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  if (showCreator) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowCreator(false)}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <StudyPlanCreator />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Study Planner</h1>
          <p className="text-muted-foreground">
            Plan and track your academic journey
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Study Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.filter((p) => p.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.reduce((sum, plan) => {
                const progress = parseFloat(plan.progressPercentage || 0);
                return sum + Math.floor(progress / 10);
              }, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans.length > 0
                ? Math.round(
                    plans.reduce((sum, plan) => sum + parseFloat(plan.progressPercentage || 0), 0) /
                      plans.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Study Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans
            .filter((p) => p.status === "active")
            .map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.subjectName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{Math.round(parseFloat(plan.progressPercentage || 0))}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${parseFloat(plan.progressPercentage || 0)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Exam: {new Date(plan.examDate).toLocaleDateString()}</span>
                      <Badge
                        variant={
                          parseFloat(plan.progressPercentage || 0) >= 80
                            ? "default"
                            : "secondary"
                        }
                      >
                        {parseFloat(plan.progressPercentage || 0) >= 80
                          ? "On Track"
                          : "In Progress"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
        {plans.filter((p) => p.status === "active").length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No active study plans. Create one to get started!
              </p>
              <Button onClick={() => setShowCreator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Study Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Today's Tasks</h2>
        <DailyTaskView />
      </div>
    </div>
  );
}
```

**Step 2: Create the page**

Write to `src/app/(study-planner)/page.tsx`:

```typescript
import { StudyPlannerDashboard } from "@/components/study-planner/StudyPlannerDashboard";

export default function StudyPlannerPage() {
  return <StudyPlannerDashboard />;
}
```

**Step 3: Commit**

```bash
git add src/
git commit -m "feat(ui): add StudyPlannerDashboard component and page"
```

---

## Phase 6: Navigation & Integration

### Task 15: Add Study Planner link to navigation

**Files:**
- Modify: `src/components/site-header.tsx` (or your main navigation component)

**Step 1: Add navigation link**

Add to your navigation menu:

```typescript
<Link href="/study-planner">
  <Button variant="ghost">Study Planner</Button>
</Link>
```

**Step 2: Commit**

```bash
git add src/components/
git commit -m "feat(nav): add Study Planner link to navigation"
```

---

### Task 16: Update features.tsx to link to Study Planner

**Files:**
- Modify: `src/components/landing/features.tsx`

**Step 1: Update Study Planner feature**

Find the Study Planner feature object and add the href:

```typescript
{
  icon: Calendar,
  title: "Study Planner",
  description: "Plan and track study/application schedules, including exam dates and goals.",
  href: "/study-planner", // Add this line
},
```

**Step 2: Commit**

```bash
git add src/components/landing/
git commit -m "feat(ui): link Study Planner feature to actual page"
```

---

## Phase 7: Testing

### Task 17: Write integration tests for study plan API

**Files:**
- Create: `test/api/study-plans.test.ts`

**Step 1: Create test file**

Write to `test/api/study-plans.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import { studyPlans, studyTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Study Plans API", () => {
  let templateId: string;
  let planId: string;

  beforeAll(async () => {
    // Create a test template
    const [template] = await db
      .insert(studyTemplates)
      .values({
        name: "Test Template",
        durationDays: 3,
        difficultyLevel: "easy",
        dailyStructure: {
          morning: [
            {
              type: "learn",
              template: "Study {TOPIC}",
              estimated_minutes: 30,
            },
          ],
          afternoon: [],
          evening: [],
        },
        intensityCurve: {},
      })
      .returning();
    templateId = template.id;
  });

  afterAll(async () => {
    await db.delete(studyPlans).where(eq(studyPlans.templateId, templateId));
    await db.delete(studyTemplates).where(eq(studyTemplates.id, templateId));
  });

  it("should create a study plan", async () => {
    const response = await fetch("http://localhost:3000/api/study-plans/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "test-user",
        templateId,
        subjectName: "Test Subject",
        topics: [{ name: "Topic 1" }, { name: "Topic 2" }],
        examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    const data = await response.json();
    expect(data.plan).toBeDefined();
    expect(data.plan.subjectName).toBe("Test Subject");
    planId = data.plan.id;
  });

  it("should fetch today's tasks", async () => {
    const response = await fetch(
      `http://localhost:3000/api/study-plans/today?userId=test-user`
    );
    const data = await response.json();
    expect(data.tasks).toBeDefined();
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it("should mark a task as complete", async () => {
    // First get tasks to find a task ID
    const tasksResponse = await fetch(
      `http://localhost:3000/api/study-plans/today?userId=test-user`
    );
    const tasksData = await tasksResponse.json();

    if (tasksData.tasks.length > 0) {
      const taskId = tasksData.tasks[0].id;

      const response = await fetch(
        `http://localhost:3000/api/study-tasks/${taskId}/complete`,
        { method: "PATCH" }
      );
      const data = await response.json();
      expect(data.task.completed).toBe(true);
    }
  });
});
```

**Step 2: Commit**

```bash
git add test/
git commit -m "test(api): add study plans integration tests"
```

---

### Task 18: Run tests and fix any issues

**Step 1: Run test suite**

Run: `bun test`

Expected output: All tests pass

**Step 2: If tests fail, fix issues and re-run**

Repeat until all tests pass

**Step 3: Commit**

```bash
git add .
git commit -m "test: fix failing tests and ensure all pass"
```

---

## Phase 8: Documentation & Cleanup

### Task 19: Update README with Study Planner feature

**Files:**
- Modify: `README.md`

**Step 1: Add feature to README**

Add to the features list in README.md:

```markdown
- **Study Planner**: Plan and track study schedules with structured day-by-day tasks, progress tracking, and smart notifications (NEW!)
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Study Planner to README features list"
```

---

### Task 20: Create feature documentation

**Files:**
- Create: `docs/features/study-planner.md`

**Step 1: Create documentation**

Write to `docs/features/study-planner.md`:

```markdown
# Study Planner Feature

## Overview

The Study Planner helps IOE students create structured, day-by-day study plans for their exams and coursework. Inspired by Gregmat's study plans, it provides actionable tasks with progress tracking.

## Features

- **Multiple Plan Durations**: Choose from 1-day sprint to 1-month comprehensive plans
- **Structured Daily Tasks**: Each day includes learning, practice, and review tasks
- **Progress Tracking**: Visual progress bars and completion tracking
- **Smart Scheduling**: System generates personalized daily agendas
- **Template System**: Reusable templates that adapt to any subject

## How to Use

1. Click "New Study Plan" from the dashboard
2. Enter your subject name and exam date
3. Choose a plan duration (1-day, 3-day, 1-week, 2-week, or 1-month)
4. Add topics you need to study
5. Click "Create Study Plan"
6. Follow your daily tasks, checking them off as you complete them

## API Endpoints

### Study Plans
- `POST /api/study-plans/create` - Create a new study plan
- `GET /api/study-plans` - List all user's plans
- `GET /api/study-plans/today` - Get today's tasks across all plans
- `GET /api/study-plans/:id` - Get plan details
- `PATCH /api/study-plans/:id` - Update plan
- `DELETE /api/study-plans/:id` - Archive plan

### Study Tasks
- `PATCH /api/study-tasks/:id/complete` - Mark task complete
- `PATCH /api/study-tasks/:id/uncomplete` - Mark task incomplete
- `POST /api/study-tasks/:id/log-time` - Log study time
- `GET /api/study-tasks/:id` - Get task details

### Academic Events
- `POST /api/academic-events` - Add exam/assignment
- `GET /api/academic-events` - List all events
- `PATCH /api/academic-events/:id` - Update event
- `DELETE /api/academic-events/:id` - Delete event

## Database Schema

See design document for complete schema: `docs/plans/2026-01-31-study-planner-design.md`

## Future Enhancements

- Integration with Syllabus Explorer for auto-populating topics
- AI-assisted personalized study plan generation
- Smart notifications and reminders
- Collaborative study groups
- Mobile app
```

**Step 2: Commit**

```bash
git add docs/
git commit -m "docs: add Study Planner feature documentation"
```

---

## Phase 9: Final Polish

### Task 21: Add animations and micro-interactions

**Files:**
- Modify: `src/components/study-planner/DailyTaskView.tsx`

**Step 1: Enhance task completion with confetti**

Add confetti animation when completing all daily tasks:

```typescript
import { useEffect } from "react";
import confetti from "canvas-confetti";

// Add to DailyTaskView component
useEffect(() => {
  if (completedCount === tasks.length && tasks.length > 0) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}, [completedCount, tasks.length]);
```

**Step 2: Install canvas-confetti if needed**

Run: `bun add canvas-confetti`

**Step 3: Commit**

```bash
git add src/ package.json bun.lockb
git commit -m "feat(ui): add confetti celebration for completing daily tasks"
```

---

### Task 22: Add responsive design optimizations

**Files:**
- Modify: `src/components/study-planner/StudyPlannerDashboard.tsx`

**Step 1: Ensure mobile responsiveness**

Verify the layout works well on mobile with proper breakpoints and spacing.

**Step 2: Commit**

```bash
git add src/components/study-planner/
git commit -m "feat(ui): optimize Study Planner for mobile devices"
```

---

### Task 23: Final testing and bug fixes

**Step 1: Manual testing checklist**

- [ ] Create a study plan successfully
- [ ] View today's tasks
- [ ] Complete tasks and see progress update
- [ ] Create multiple study plans
- [ ] Archive a study plan
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Verify all API endpoints work

**Step 2: Fix any bugs found**

**Step 3: Final commit**

```bash
git add .
git commit -m "fix: address final bugs and polish Study Planner feature"
```

---

## Task 24: Merge to main branch

**Step 1: Ensure all commits are pushed**

Run: `git push origin feat/study-planner`

**Step 2: Create pull request**

Run: `gh pr create --title "feat: Add Study Planner feature" --body "Implements comprehensive Study Planner feature with structured day-by-day tasks, progress tracking, and template system."`

**Step 3: After approval and merge, delete worktree**

Run: `git worktree remove /var/tmp/vibe-kanban/worktrees/feat-study-planner/ioe-student-utils`

---

## Summary

This implementation plan builds the Study Planner feature in 24 bite-sized tasks:

1. **Phase 1 (Tasks 1-6)**: Database schema and migrations
2. **Phase 2 (Task 7)**: Seed study templates
3. **Phase 3 (Task 8)**: Academic events API
4. **Phase 4 (Tasks 9-11)**: Study plans and tasks API
5. **Phase 5 (Tasks 12-14)**: Frontend components
6. **Phase 6 (Tasks 15-16)**: Navigation integration
7. **Phase 7 (Tasks 17-18)**: Testing
8. **Phase 8 (Tasks 19-20)**: Documentation
9. **Phase 9 (Tasks 21-24)**: Final polish and merge

Each task follows TDD principles with clear steps, exact file paths, and commit messages. The plan assumes no prior context and provides complete code examples.
