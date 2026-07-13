# Course Explorer

Course Explorer is an outline-first learning workspace for IOE courses. Students
can find a course by name, code, or topic, review its syllabus hierarchy, focus
on exam or pass-essential topics, open resources, inspect prerequisite
relationships, and seed a Study Planner workflow.

## Student routes

| Purpose | Route |
| --- | --- |
| Search available outlines | `/course-explorer` |
| Open a course workspace | `/course-explorer/[course-slug]` |
| Select a topic | `/course-explorer/[course-slug]?topic=[topic-slug]` |
| Use exam focus | `/course-explorer/[course-slug]?focus=exam` |
| Use pass essentials | `/course-explorer/[course-slug]?focus=essentials` |
| Open the relationship map | `/course-explorer/[course-slug]?view=map` |

Course, topic, focus, and view state are shareable through the URL. Legacy
course IDs, codes, and previous slugs resolve to the canonical course slug and
redirect at user-facing route boundaries.

The Study Planner handoff uses a typed seed containing the course slug,
selected topic slugs, focus mode, and optional target date. Exam, essentials,
and full-syllabus focus map to the corresponding editable planner goal.

## Student workflow

1. Search for a course, course code, or topic.
2. Open a course that has published topics.
3. Browse units and nested topics in academic order.
4. Choose Overview, Exam focus, Pass essentials, or Full syllabus.
5. Select a topic to review its description, prerequisites, and resources.
6. Add the selected topic to Study Planner.
7. Open the optional map when hierarchy or prerequisite relationships need a
   visual explanation.

Courses with no active topics appear separately as outlines that are coming
soon. They are never presented as ready learning workspaces.

## Focus modes

- **Overview:** complete structure with no destructive filtering.
- **Exam focus:** highlights topics with valid exam weightage and includes their
  strong prerequisite closure.
- **Pass essentials:** highlights core topics and their strong prerequisite
  closure.
- **Full syllabus:** complete academic order without focus emphasis.

Focus modes highlight and explain topics. They do not remove required
foundations or claim to be ordered study paths.

## Relationship model

Course structure and prerequisites are separate concepts:

```text
Course
└── Unit
    └── Topic
        └── Child topic, linked by parentTopicId

Topic
└── Prerequisite topic, linked by topic_prerequisite
```

The outline and structural map use units plus `parentTopicId`. The optional
prerequisite overlay uses `topic_prerequisite` and labels strong and weak
relationships. The student map is read-only.

## Public API

### Search course learning summaries

```http
GET /api/course-explorer/catalog?search=pointer&readiness=ready&page=1&limit=24
```

Search covers active course names, course codes, and topic names. Readiness may
be `ready`, `upcoming`, or `all`.

### Get the outline-first learning view

```http
GET /api/course-explorer/courses/slug/:slug/learning-view
```

The response contains course identity, program curriculum placements (including
year, part, and course type when known), readiness counts, unit/topic hierarchy,
prerequisite references, and focus reasons. It does not contain React Flow
nodes.

### Get topic details and resources

```http
GET /api/course-explorer/topics/slug/:slug
```

### Get study planning context

```http
GET /api/course-explorer/courses/slug/:slug/planning-context
```

### Legacy contracts

The following remain available for compatibility:

```http
GET /api/course-explorer/courses
GET /api/course-explorer/courses/slug/:slug
GET /api/course-explorer/courses/:id
GET /api/course-explorer/courses/slug/:slug/mindmap
GET /api/course-explorer/units/slug/:slug
GET /api/course-explorer/units/slug/:slug/topics
GET /api/course-explorer/topics/slug/:slug
POST /api/course-explorer/topics/slug/:slug/view
```

The topic view endpoint is deprecated. It returns compatibility success but
does not mutate course content timestamps or claim to persist analytics.

## Slug compatibility

Database IDs remain the primary keys and admin mutation identifiers. Public
navigation uses course slugs.

`academic_course_slug_alias` stores previous slugs before canonical values are
backfilled from normalized course codes. Resolution order is:

1. canonical slug
2. previous slug alias
3. course code
4. internal ID for compatibility only

An old slug is never reused for another course.

## Instructor workflow

Instructor routes use readable course slugs:

```text
/course-explorer/instructor/courses
/course-explorer/instructor/courses/new
/course-explorer/instructor/courses/[course-slug]/edit
```

The list distinguishes a draft with no topics from a published course with
active topics. Duplicate courses receive readable `copy` slugs and unique copy
codes. MCP graph validation, diff, export, and upsert contracts retain their
existing ID-based behavior.

## Accessibility and responsive behavior

- The complete course workflow works without opening the map.
- Topic selection uses native buttons and visible focus states.
- Focus meaning is presented with labels, not color alone.
- Prerequisites are labeled by strength and select their topic when activated.
- Mobile uses a single-column outline with topic details rendered inline.
- Desktop uses a sticky topic-detail region.
- Continuous decorative motion was removed from the course explorer.
- The map is lazy-loaded and not part of the initial outline interaction.
- The prerequisite overlay can be shown or hidden without changing hierarchy.
- System dark mode is applied through the shared theme provider.

## Verification

Course Explorer changes should run:

```bash
bun run check:write
bun run typecheck
bun test test/course-explorer-revamp.test.ts
bun test test/course-explorer-api.test.ts
bun test test/course-graph-service.test.ts
bun test test/course-explorer-mcp-tools.test.ts
bun run build
```

Database-backed tests must report a real skip when the database is unavailable.
They must not pass through placeholder assertions.

The migration was rehearsed against the repository's production-derived Neon
Local branch. Runtime verification covers the landing page, empty-course state,
permanent redirects from course code and internal ID to the canonical slug, and
representative hierarchy/resource views at 360px, 768px, and 1440px in light and
dark themes. A disposable fixture for repeating visual checks is available at
`scripts/verify/seed-course-explorer-fixture.ts`.
