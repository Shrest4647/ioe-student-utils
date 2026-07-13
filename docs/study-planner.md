# Study Planner

The Study Planner turns an IOE course outline, or a manually entered subject,
into a capacity-aware daily schedule. It is designed as a learning workspace:
students choose what matters, preview the generated work, complete today's
tasks, recover missed work, and open the course resources associated with each
topic.

## Student workflow

1. Open `/study-planner` and choose **Plan a course**.
2. Select a ready Course Explorer outline, or switch to manual topics.
3. Select topics and mark material that is already known.
4. Choose a goal: pass essentials, exam preparation, or full syllabus.
5. Enter the target date and available minutes for each weekday.
6. Review the deterministic schedule and any capacity warnings before creating
   the plan.
7. Use the plan workspace's **Today**, **Plan**, **Progress**, and **Resources**
   views to do and adjust the work.

Course Explorer can prefill the creator with `?course=<course-slug>` and
`?topics=<topic-slug>`. Manual plans remain supported when no course outline is
available.

## Product rules

- PostgreSQL UUIDs remain internal primary keys. Courses, plans, topics, and
  tasks use readable slugs at navigation and mutation boundaries.
- Study-plan slugs are unique per user, not globally.
- `study_tasks` is the authoritative schedule. `study_plans.daily_tasks` is
  retained as a compatibility snapshot for older callers and must not be used
  for completion or Today queries.
- Date-only scheduling is evaluated in `Asia/Kathmandu`.
- The scheduler is deterministic for the same normalized input. It respects
  strong prerequisites, topic priority, estimated hours, exam weight, known
  topics, weekday capacity, and a lighter exam eve.
- A blocking capacity warning prevents activation. Non-blocking warnings remain
  visible in the preview.
- Completed tasks are never moved by rebalancing. Recovery changes are shown in
  a preview before they are persisted.
- UI progress is derived from persisted task rows; it is not a mastery score.

## Main surfaces

| Route | Purpose |
| --- | --- |
| `/study-planner` | Today-first dashboard, plan list, and inline creator |
| `/study-planner/[planSlug]` | Canonical plan workspace |
| `/dashboard/study-plans/[slug]` | Compatibility redirect to the canonical workspace |
| `/course-explorer` | Searchable course and topic catalog |
| `/course-explorer/[courseSlug]` | Outline-first course workspace and optional relationship map |

The planner components live in `src/components/study-planner/`:

- `StudyPlannerDashboard.tsx` owns the Today-first landing state.
- `StudyPlanCreator.tsx` owns course/manual selection, capacity input, preview,
  and activation.
- `StudyPlanWorkspace.tsx` owns completion, notes, task dates, progress,
  resources, and recovery.
- `OfflineNotice.tsx` explains when mutations cannot be saved.

## Data model

The relevant tables are defined in
`src/server/db/schema/study-planners.ts`.

### `study_templates`

Reusable planning presets. Templates have stable slugs, descriptions, a
planning mode, and a version in addition to the legacy duration and structure
fields.

### `study_plans`

A user's activated plan. Important fields include:

- `user_id` and user-scoped `slug`
- optional `course_id` and `academic_event_id`
- `goal`, `start_date`, `exam_date`, and `end_date`
- `daily_minutes` and weekday `availability`
- `generation_input`, `schedule_version`, and `last_rebalanced_at`
- legacy `daily_tasks` compatibility snapshot
- persisted progress and lifecycle status

### `study_plan_topics`

The normalized set of course topics selected for a plan, including whether the
student marked a topic as already known and the scheduler's snapshot metadata.

### `study_tasks`

The authoritative task rows. A task has a plan-scoped slug, optional linked
course topic, scheduled date, stable position, origin, completion state, notes,
and time-spent fields. New JSON snapshots and relational rows use the same task
UUID during the compatibility period.

### `academic_events` and `study_logs`

Academic events provide the target exam or deadline. Study logs retain optional
session-level time records for a task.

## API contracts

All endpoints are mounted below `/api`.

### Planning and workspaces

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/course-explorer/catalog` | Search course names, codes, and topic names with readiness metadata |
| `GET` | `/course-explorer/courses/slug/:slug/planning-context` | Ordered planning topics, prerequisites, estimates, priority, and resources |
| `POST` | `/study-plans/preview` | Produce a capacity-aware schedule without writing data |
| `POST` | `/study-plans` | Build and activate the reviewed schedule |
| `GET` | `/study-plans` | Return real plan summaries for the current user |
| `GET` | `/study-plans/today` | Return today's authoritative relational tasks across active plans |
| `GET` | `/study-plans/upcoming` | Return unfinished tasks for the next seven days |
| `GET` | `/study-plans/slug/:slug/workspace` | Return the canonical plan workspace |
| `PATCH` | `/study-plans/slug/:planSlug/tasks/:taskSlug` | Complete, uncomplete, move, or add notes to a task |
| `POST` | `/study-plans/slug/:slug/rebalance/preview` | Preview overdue-task recovery |
| `POST` | `/study-plans/slug/:slug/rebalance` | Recompute and apply the accepted recovery |

Preview and activation accept the same normalized `input` shape:

```ts
{
  courseSlug?: string;
  subjectName?: string;
  topics?: PlanningTopic[];
  topicSlugs?: string[];
  knownTopicSlugs?: string[];
  goal: "minimum" | "exam-prep" | "full-coverage";
  startDate: string;
  examDate: string;
  availability: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  preferredSessionMinutes: number;
}
```

### Compatibility endpoints

Legacy UUID-based plan and task endpoints remain available during migration.
They must resolve to the same records and authorization rules as the canonical
slug endpoints. New UI code should use slugs.

## Scheduler

`src/server/utils/study-scheduler.ts` contains the pure scheduling logic.
`src/server/elysia/services/study-plan-service.ts` resolves course context,
persists previews, reads workspaces, updates tasks, and performs rebalancing.

The scheduler:

1. expands strong prerequisite closure;
2. topologically orders prerequisites before dependent topics;
3. scores work from goal, priority, weight, known state, and estimates;
4. creates learn, practice, and review sessions with stable keys and slugs;
5. packs sessions into weekday capacity without crossing the exam date; and
6. reports work that could not fit instead of silently dropping it.

## Development data

Default templates are part of the main seed composition:

```bash
bun run db:seed
```

Create or refresh a realistic, development-only Data Structures plan for an
existing user:

```bash
bun run db:seed:study-demo -- <user-id>
```

The demo is relative to the seed date and includes completed, overdue, current,
and upcoming tasks. It is generated through the production scheduler, linked to
course topics and an exam event, and is idempotent for that user. The command
refuses to run in production.

Verify the persisted demo invariants after seeding:

```bash
NODE_ENV=development bun run verify:study-demo -- <user-id>
```

## Verification

Run the standard checks with Bun:

```bash
bun run check:write
bun run typecheck
bun test
bun run build
```

The production service integration spec in `test/specs/study-plans.spec.ts`
requires a migrated test database and is opt-in:

```bash
RUN_DB_INTEGRATION_TESTS=1 bun test test/specs/study-plans.spec.ts
```

Pure scheduler coverage is in `test/study-scheduler.test.ts`. Course Explorer
query and hierarchy coverage is in `test/course-explorer-revamp.test.ts` and the
course API specs.

## Related documents

- [Study Planner and Course Explorer Learning Workspace Revamp](./plans/2026-07-12-study-planner-learning-workspace-revamp.md)
- [Course Explorer Revamp](./plans/2026-07-12-course-explorer-revamp.md)
- [Original Study Planner Design](./plans/2026-01-31-study-planner-design.md)
- [Original Study Planner Implementation Plan](./plans/2026-01-31-study-planner-implementation.md)
- [Elysia guide](./elysia.md)
- [Drizzle guide](./drizzle.md)
