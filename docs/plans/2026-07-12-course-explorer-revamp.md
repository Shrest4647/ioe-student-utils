# Course Explorer Revamp Plan

Status: Implemented and verified  
Date: 2026-07-12  
Scope: Student discovery, course learning workspace, human-readable routes, compatibility, and the minimum instructor changes needed to support them

## Outcome

Rebuild Course Explorer around the student's next learning decision instead of around a graph component.

The default experience will be a fast, readable course outline with meaningful search, program context, focus modes, topic detail, prerequisites, and resources. The relationship map remains available as an optional view when it adds understanding. Existing database IDs and API contracts remain valid, while every user-facing route becomes slug-first and legacy identifiers resolve to canonical URLs.

## Sources reviewed

- `docs/course-explorer.md`
- `docs/plans/2026-02-01-course-explorer-design.md`
- `docs/plans/2026-02-01-course-explorer-implementation.md`
- `docs/plans/2026-02-04-course-explorer-base-page.md`, because it explains the shipped landing page even though it was not part of the original request
- Current routes, components, Elysia handlers, schemas, migrations, seeders, MCP consumers, and tests
- The supplied `/course-explorer` screenshot

The provided screenshot and source code were the visual truth for this review. A fresh browser probe was not possible because no development server was listening on port 3000. The local database was also unavailable during a direct query.

## Self-critical review

### What the original work got right

1. **It identified real student needs.** Course hierarchy, prerequisites, topic priority, exam weightage, resources, and a Study Planner handoff are all valuable concepts.
2. **It chose a durable core model.** Courses, units, recursive topics, prerequisite edges, and resource links are separable and reusable beyond one UI.
3. **It kept AI outside the student request path.** MCP-assisted authoring is a sound instructor workflow and avoids making the public experience depend on probabilistic backend output.
4. **It planned for slugs early.** Courses, units, and topics have slugs and public slug endpoints already exist.
5. **It recognized accessibility requirements.** Keyboard navigation, screen reader descriptions, high contrast, and a tree alternative were named in the design document.
6. **It separated Course Explorer from Study Planner conceptually.** “What to study” and “when to study” are distinct responsibilities even though their handoff must work.
7. **It added structured graph import tooling.** Validation, diff, upsert, and MCP resource contracts are useful foundations for content operations.

These parts should be preserved. The revamp is not a schema rewrite or a React Flow rewrite. It is a correction of product hierarchy, route consistency, and data contracts.

### Where the design was too solution-led

The original design selected “mindmap resembling NotebookLM” before validating whether a graph was the simplest way to answer the student's main questions. It then made that choice the page architecture: fixed study-path sidebar, graph canvas, and fixed sources panel.

That sequence caused several downstream mistakes:

- “Understand this course” became “operate this visualization.”
- The first view attempted to show every topic, which increases cognitive load for a new student.
- The accessible tree alternative was documented but never made an implementation task.
- Mobile behavior, content readiness, and empty-course handling were secondary to canvas behavior.
- Visual polish and motion received more attention than information scent and task completion.
- Accessibility, error boundaries, and performance were deferred to a final polish task instead of shaping the architecture.

### Where the implementation plan was not executable enough

- The estimate of two to three days for schema, migrations, APIs, graph UI, instructor tools, E2E coverage, accessibility, and performance was not credible.
- Several code samples used `any`, placeholder algorithms, hard-coded `bct-301`, and unfinished comments while claiming TDD.
- The E2E example used unsupported expectations, but Playwright and a `test:e2e` script were not present in the package setup.
- The later landing-page plan used `npm` despite the repository's Bun-only rule.
- “Smart filters” were specified as toggled chips without a real filter contract.
- “Final polish” contained major architectural work such as keyboard access and virtualization.
- `git add .` was proposed in a repository where unrelated changes can exist.
- The plan described routes and file locations that drifted from the actual Elysia and App Router structure.

### Missed opportunities

- **Start from curriculum placement.** The BCT and Civil seed data already contains year and part values, but that context is discarded when courses are linked to programs. It could have powered the most useful discovery filters.
- **Separate catalog from learning.** The general `/courses` surface serves ratings and institutional context, while Course Explorer serves learning. A clear relationship between them was never defined, so code, slug, and ID conventions drifted.
- **Publish only ready content.** The instructor workflow could have exposed a readiness checklist before a course appeared to students.
- **Use progressive disclosure for the syllabus.** Units and topic hierarchy were ideal for an outline-first experience, with the graph available only for relationship questions.
- **Design around continuation.** Recent course, selected topic, progress, and a real Study Planner seed were all more valuable learning-platform behaviors than decorative landing statistics.
- **Make success measurable.** No product metrics distinguished finding a course, opening a topic, reaching a resource, or starting a plan.
- **Use server rendering strategically.** Course identity and syllabus structure can render on the server, leaving only search state, topic selection, and the optional map as client interactions.

### What the shipped experience reveals

| Area | Current evidence | Consequence |
| --- | --- | --- |
| Landing hierarchy | A 66vh animated hero, decorative statistics, large dead space, and a small course result below the fold | The task is visually subordinate to marketing-style decoration |
| Copy | “Academic Universe,” “decrypting records,” “sector,” “signals,” and “sensors” | Students must decode product language before acting |
| Search | Placeholder promises name, code, or topic search; API only filters course name | The primary control overpromises |
| Filters | Chips only update local active state; departments are guessed from the first word of unit names | Controls look functional but do not change results |
| Statistics | “Core Courses” means credits greater than or equal to three | A credit value is incorrectly presented as learning importance |
| Content readiness | Every active academic course is listed, including courses with zero units or topics | Users can launch an explorer with nothing to explore |
| Course card | “Scan Modules” and “Launch Explorer” remain active for empty courses | The interface creates predictable dead ends |
| Course page | Fixed 256px and 384px side panels surround the canvas | The layout does not collapse into a usable mobile workflow |
| Graph semantics | Prerequisite edges are used as the expandable topic tree; unit and `parentTopicId` hierarchy are omitted | Curriculum structure and dependency structure are conflated |
| Study paths | Server filters nodes, then the client filters again | Paths can remove required foundations and are not ordered learning paths |
| Edge semantics | Dependency type is discarded when API edges become React Flow edges | Strong and weak relationships look the same |
| Read-only affordance | `onConnect` adds temporary edges on a student canvas | The UI suggests an edit that cannot persist |
| Topic detail | A permanent empty panel waits for selection; hard-coded gray colors bypass semantic tokens | Space is wasted and dark-mode behavior is inconsistent |
| Motion | Random star positions and continuous animation have no reduced-motion strategy | Motion is decorative, nondeterministic, and potentially distracting |
| Route model | `/course-explorer`, protected `/course-explorer/courses`, `/courses`, and instructor routes disagree about slug, code, and ID | Users and maintainers cannot predict a course URL |
| Study Planner | The CTA passes `?course=<slug>`, but no consumer was found in the planner surface | A prominent integration is currently only a link |
| View tracking | The topic view endpoint only updates `updatedAt` | Documentation claims analytics that do not exist |
| Test confidence | API tests return a passing assertion when the database is unreachable | A green suite can mean the integration never ran |

### Heuristic score for the shipped student surface

| Heuristic | Score | Reason |
| --- | ---: | --- |
| Task clarity | 2/5 | Search is visible, but the page does not lead with a real student decision |
| Information architecture | 1/5 | Catalog, syllabus hierarchy, prerequisites, and resource detail are mixed together |
| Functional integrity | 1/5 | Search, filters, tracking, and planner integration do not match their labels |
| Learnability | 2/5 | Familiar academic terms exist, but themed copy and canvas controls add friction |
| Responsive behavior | 1/5 | The core layout depends on three fixed-width columns |
| Accessibility | 1/5 | The documented alternative and relationship descriptions are absent |
| Visual hierarchy | 2/5 | The landing has polish, but decoration dominates content and the screenshot shows weak scale and density |
| Architectural integrity | 2/5 | The data model is sound, but the UI view model conflates hierarchy with dependencies |
| Compatibility discipline | 2/5 | Slug endpoints exist, but routes still expose or assume IDs and codes inconsistently |

## Reframed product definition

### Primary student jobs

1. Find the right course for my program and term.
2. Understand the syllabus at a glance.
3. See what matters for my current goal, without losing required foundations.
4. Open the best material for a topic.
5. Continue into a realistic study plan.

The graph is a supporting tool for job 2 or 3. It is not the product.

### Launch success criteria

- A student can reach a useful topic resource within three interactions after opening a course.
- Search results match course name, course code, and topic name as advertised.
- No course with zero active topics is presented as ready to explore.
- Every canonical user-facing course URL contains a readable slug, never an ID, UUID, or nanoid.
- Existing public API paths and saved course URLs still resolve.
- At 360px wide there is no horizontal page overflow and every primary action remains reachable.
- The complete default workflow is usable with keyboard and screen reader without opening the map.
- Selecting a focus mode never hides a required prerequisite without explaining and retaining it.
- React Flow is not part of the initial landing or outline bundle.
- Integration tests fail clearly when their required database is unavailable.

## Experience direction

### Physical scene

An IOE student uses a mid-range phone between classes or a shared laptop in daylight, trying to find today's subject, understand the next unit, and open a trustworthy resource before attention moves elsewhere.

This calls for a light-first, restrained product surface with full dark-mode support. The existing green accent should indicate actions, selection, and progress, not decorate inactive content.

### Design rules

- Use the existing semantic OKLCH tokens and shadcn component vocabulary.
- Keep one product type family and a compact fixed type scale.
- Remove gradient text, glass decoration, star fields, animated orbs, and hero metrics.
- Replace the oversized hero with a compact task header and immediately visible results.
- Use cards only for independent course choices. Use rows, sections, and disclosure for syllabus hierarchy.
- Never rely on red, orange, or gray alone for priority. Pair state with labels and icons.
- Motion is limited to 150 to 250ms state transitions and honors reduced motion.
- Keep copy literal: “Find a course,” “Exam focus,” “Show prerequisites,” “Open resource,” and “Add to study plan.”

## Proposed information architecture

```text
Course Explorer
├── Find a course
│   ├── Search by course, code, or topic
│   ├── Program and term filters when data is complete
│   ├── Continue learning
│   └── Courses with learning content
└── Course workspace
    ├── Overview
    │   ├── Course identity and placement
    │   ├── Focus mode
    │   └── Unit and topic outline
    ├── Topic detail
    │   ├── Description and learning estimate
    │   ├── Prerequisites
    │   ├── Resources
    │   └── Mark studied or add to plan
    └── Map, optional
        ├── Unit and parent-topic hierarchy
        └── Prerequisite overlay
```

### Landing page

1. Compact heading: “Find a course to study.”
2. Search with actual name, code, and topic matching.
3. URL-backed filters for program and year/part only when the underlying data is sufficiently populated.
4. “Continue learning” for signed-in progress or a local recent-course fallback.
5. A readable result list grouped by program placement or sorted by code.
6. A separate low-emphasis “Outlines coming soon” section for known courses without explorer content.

Remove statistics that do not help a decision. Show useful metadata on each result: code, program, year/part, active topic count, resource count, and last content update.

### Course workspace

Desktop uses a syllabus outline plus a sticky topic detail region. Mobile uses one column with topic detail expanded inline beneath the selected topic. Tablet can use a collapsible detail region. No modal is required.

The default view is the outline:

- Course name, code, credits, program placement, and breadcrumb.
- Focus control: Overview, Exam focus, Pass essentials, Full syllabus.
- Unit sections with topic count and estimated hours.
- Topics ordered by `sortOrder` and nested by `parentTopicId`.
- Priority, weightage, resource count, and prerequisite count shown as compact labeled metadata.
- Selected topic stored in the URL as `?topic=<topic-slug>` so refresh and sharing preserve context.

The map is a lazy-loaded secondary tab. Unit and parent-topic relationships define hierarchy. Prerequisites are a separate optional overlay with strong and weak labels. The student canvas is read-only.

### Focus modes, not fake paths

- **Overview:** preserves the whole unit structure and highlights the next meaningful entry points.
- **Exam focus:** ranks topics by valid weightage and marks why each is included. Prerequisites remain visible.
- **Pass essentials:** highlights core topics plus the prerequisite closure needed to understand them.
- **Full syllabus:** removes emphasis but preserves the academic order.

Do not call these curated paths until the product returns an explicit ordered sequence with a start, completion rule, and progress state.

## Route and identifier strategy

### Principle

Internal IDs remain unchanged as primary keys and mutation references. Human-readable slugs are a presentation and navigation contract. Replacing primary keys would add risk without improving the student experience.

### Canonical routes

| Purpose | Canonical route |
| --- | --- |
| Learning course list | `/course-explorer` |
| Learning workspace | `/course-explorer/[courseSlug]` |
| Selected topic state | `/course-explorer/[courseSlug]?topic=[topicSlug]` |
| Optional map state | `/course-explorer/[courseSlug]?view=map` |
| Instructor course list | `/course-explorer/instructor/courses` |
| Instructor course editor | `/course-explorer/instructor/courses/[courseSlug]/edit` |
| General rating catalog | `/courses` |
| General course detail | `/courses/[courseSlug]` |

`/course-explorer/courses` should redirect to `/course-explorer`. Broken `/instructor/courses/*` links should redirect to the canonical instructor paths.

### Slug migration

The current academic-course backfill creates `code` plus an MD5 fragment, and duplication can create a nanoid slug. Those values are stable but not clean enough for canonical URLs.

Use an expand and contract migration:

1. Add `academic_course_slug_alias` with `courseId`, unique `slug`, and timestamps.
2. Copy every current course slug into the alias table before changing canonical values.
3. Audit normalized course codes for collisions.
4. Prefer normalized unique course code for the canonical slug, for example `ct-501`. Fall back to a readable code and name combination only on collision.
5. Update `academic_course.slug` in a backfill-safe migration.
6. Resolve canonical slug first, then alias, then legacy course code or internal ID only for compatibility.
7. Return a permanent redirect from alias, code, or ID routes to the canonical slug route.
8. Never recycle an old slug for another course.

Unit and topic slugs remain stable in this revamp. Their current public slug endpoints continue to work. A later migration may scope unit slugs by course and topic slugs by unit, but that should happen only with equivalent alias and redirect coverage.

## Data and architecture plan

### Keep

- `academic_course`
- `course_unit`
- `course_topic`
- `topic_prerequisite`
- `unit_prerequisite`
- `topic_resource_link`
- Existing MCP graph validation, diff, export, and upsert contracts
- Existing ID-based admin mutations

### Add or clarify

1. **Course slug aliases.** Additive table described above.
2. **Curriculum placement.** Add nullable `yearNumber`, `partNumber`, and `courseType` to `collegeprogram_to_course`, because placement belongs to a program-course relationship. Existing seed `level` values can backfill year and part.
3. **Explorer readiness.** Compute `activeUnitCount`, `activeTopicCount`, `resourceCount`, and `hasExplorerContent`; do not infer readiness from course activation alone.
4. **Weightage semantics.** Treat the existing value as a percentage only when it is between 0 and 100. Record content-quality warnings instead of rendering invalid values.
5. **Progress.** Defer a new server table until the outline workflow is proven. Launch with recent-course state locally; add authenticated `course_topic_progress` only in the learning-continuity increment.

### New read model

Create `course-explorer-query-service.ts` as the authoritative student-facing query layer. It should return domain data, not React Flow objects.

```ts
interface CourseLearningView {
  course: CourseSummary;
  placements: CoursePlacement[];
  readiness: ExplorerReadiness;
  units: Array<UnitWithTopicTree>;
  prerequisites: TopicPrerequisiteRef[];
  focus: Record<FocusMode, TopicFocusReason[]>;
}
```

IDs may remain in the payload as stable keys, but components and URLs must use slugs. Resources remain lazy-loaded through the topic-detail endpoint.

### API evolution

Add without removing current endpoints:

- `GET /api/course-explorer/catalog` for searchable, filterable explorer-ready course summaries.
- `GET /api/course-explorer/courses/slug/:slug/learning-view` for the outline, prerequisites, readiness, placement, and focus metadata.
- Keep `GET /api/course-explorer/courses/slug/:slug/mindmap` as a legacy contract until its consumers migrate.
- Keep ID-based admin and MCP endpoints.
- Extend public course resolution to accept an alias or code, but respond with the canonical slug and redirect metadata.

Search must be implemented once in the server query layer and cover course name, course code, and active topic name. Filter state belongs in URL search parameters and should not be duplicated in disconnected client state.

### Component boundaries

```text
course-explorer-page.tsx, server component
├── course-finder.tsx, client search and URL filters
├── course-result-list.tsx
└── course-availability-state.tsx

course-workspace-page.tsx, server component
├── course-workspace-header.tsx
├── focus-mode-control.tsx
├── syllabus-outline.tsx
│   ├── unit-section.tsx
│   └── topic-row.tsx
├── topic-detail.tsx
└── relationship-map.tsx, lazy client island
```

Remove duplicate data-fetching logic from `course-explorer.tsx` and the unused or parallel mindmap hook. One query-key factory and one response type should serve the student surface.

## Compatibility contract

The following are non-negotiable:

- No primary-key changes.
- No removal or renaming of current public or admin API routes in the same release.
- Old course slug, code, and ID URLs resolve and redirect to the canonical slug.
- Current MCP tools and graph resources keep their payload shapes.
- Existing study-planner query links continue to resolve while their consumer is implemented.
- Existing topic and unit slugs remain valid.
- Schema changes use expand, backfill, verify, then enforce. They must work on production-derived local data.
- Redirect and alias behavior receives contract tests before route cleanup.

## Delivery plan

### Phase 0: Characterize reality

Files: existing tests, route inventory, query fixtures, no user-facing redesign yet.

- Add contract tests for every current course route and its parameter meaning.
- Replace silent database-success assertions with an explicit integration-test requirement.
- Add fixture-backed pure tests for hierarchy construction, prerequisite closure, focus reasons, and slug generation.
- Audit active courses, unit/topic coverage, invalid weightage, orphan prerequisites, slug quality, and normalized-code collisions.
- Record baseline bundle size and mobile behavior.

Exit criteria: the old surface's actual contracts and data quality are measurable, and a missing database causes a clear skipped suite or failure according to CI mode, never a false pass.

### Phase 1: Canonical slugs and query foundation

Likely files:

- `src/server/db/schema/`
- generated Drizzle migration
- `src/server/elysia/services/course-explorer-query-service.ts`
- `src/server/elysia/routes/course-explorer.ts`, preferably split into focused route modules during this phase
- route pages that currently accept `[id]`, code, or ambiguous `[slug]`

Tasks:

- Add the slug-alias schema and backfill.
- Add one resolver that returns canonical, alias, code, or ID matches with canonicalization metadata.
- Add catalog and learning-view endpoints.
- Add explorer readiness counts and real topic search.
- Make instructor edit routes slug-first while resolving legacy IDs.
- Keep all existing API routes and MCP consumers green.

Exit criteria: canonical course URLs are clean, every legacy route resolves, and the new read model represents unit hierarchy and prerequisites separately.

### Phase 2: Replace the landing page

Likely files:

- `src/app/course-explorer/page.tsx`
- new focused components under `src/components/course-explorer/`
- remove or retire the current landing, filter-chip, decorative statistic, and card variants after route parity

Tasks:

- Build the compact task header and server-backed search.
- Add real URL filters only for complete placement data.
- Show explorer-ready courses first and incomplete outlines separately.
- Add recent course continuation.
- Implement loading, zero-results, unavailable-content, and server-error states with literal copy.
- Remove continuous decorative motion and false metrics.

Exit criteria: every visible control changes data or navigation, useful results appear in the first viewport, and empty courses cannot lead to a dead explorer.

### Phase 3: Ship the outline-first course workspace

Likely files:

- `src/app/course-explorer/[slug]/page.tsx`
- new workspace, outline, unit, topic, and detail components
- `src/types/course-explorer.ts`

Tasks:

- Render server-fetched course summary and unit/topic hierarchy.
- Use `parentTopicId` for nesting and `sortOrder` for academic order.
- Store topic and focus state in the URL.
- Lazy-load topic resources and handle empty, loading, and error states in place.
- Make prerequisites navigable and labeled by strength.
- Preserve selection when changing view and clear it only when the selected topic truly leaves scope.
- Implement mobile inline detail and desktop sticky detail.

Exit criteria: the complete learning workflow works without React Flow, mouse input, or a wide viewport.

### Phase 4: Add honest focus modes and the optional map

Likely files:

- pure focus selectors in the query service
- a simplified `relationship-map.tsx`
- topic and edge renderers

Tasks:

- Compute exam and pass focus sets with prerequisite closure.
- Explain inclusion with concise reasons such as “12% exam weight” or “required for Pointers.”
- Lazy-load the map only when selected.
- Render units and parent-topic hierarchy as the structural layer.
- Render prerequisites as a toggleable overlay that preserves strong/weak meaning.
- Remove student `onConnect`, uncontrolled dragging persistence, random visuals, and hard-coded colors.
- Provide equivalent relationship text in the outline and detail views.

Exit criteria: focus modes never create broken dependency chains, and the map is useful but never required.

### Phase 5: Make the learning handoff real

Tasks:

- Define a typed `StudyPlanSeed` containing course slug, selected topic slugs, focus mode, and optional target date.
- Make the existing `/study-planner?course=<slug>` path consume the course instead of ignoring it.
- Let students select units or topics before planning.
- Add local recent-course state at launch.
- After usage validation, add authenticated topic progress with anonymous-to-account reconciliation.
- Replace the fake topic view update with a real analytics event or remove the claim from documentation while keeping the legacy endpoint compatible.

Exit criteria: “Add to study plan” opens a populated, editable plan flow, and progress is never implied unless stored.

### Phase 6: Instructor and content-quality hardening

Tasks:

- Fix instructor links to their actual mounted paths.
- Use course slugs in visible instructor URLs while IDs remain mutation keys.
- Show readiness and data-quality warnings: no units, no topics, no resources, invalid weightage, orphan prerequisite, or cycle.
- Prevent duplicate-course creation from assigning a nanoid as a public slug.
- Add preview links to the canonical learning workspace.
- Keep MCP graph import compatibility and expose validation warnings before apply.

Exit criteria: an instructor can tell why a course is not student-ready before publishing it.

### Phase 7: Verification and controlled rollout

- Unit tests for slug generation, alias resolution, hierarchy, focus modes, and prerequisite cycles.
- API contract tests for all old and new routes.
- Migration tests against populated production-like fixtures.
- E2E tests for search, course open, topic selection, resource open, focus mode, map view, legacy redirect, and Study Planner handoff.
- Mobile tests at 360px and 768px, desktop at 1280px and above.
- Keyboard and screen-reader checks, reduced motion, zoom to 200%, and no color-only meaning.
- Dark-mode visual checks using semantic tokens.
- Performance check that React Flow is absent from initial outline JavaScript.
- Run `bun run check:write`, `bun run typecheck`, targeted Bun tests, and the repository CI script before release.
- Release behind a route-level feature flag only if rollback cannot be achieved by reverting the page components alone.
- Monitor no-result searches, explorer-ready course opens, topic/resource opens, planner starts, and map-view usage.

Exit criteria: compatibility tests, accessibility checks, migration rehearsal, and the student happy path all pass before the old UI components are removed.

## Initial file-level change map

### Retire after parity

- `src/components/course-explorer/course-explorer-landing.tsx`
- `src/components/course-explorer/filter-chips.tsx`
- the current graph-first `course-explorer.tsx`
- duplicate or unused mindmap data hooks

### Reuse or simplify

- `mindmap-node.tsx`
- `sources-panel.tsx`, reshaped into topic detail
- `course-card.tsx`, simplified to a decision-focused result row/card
- `course-graph-service.ts` and validator
- current public slug endpoints

### Add

- slug-alias schema and resolver
- explorer query service and response types
- course finder and result list
- course workspace header
- syllabus outline, unit section, and topic row
- topic detail
- lazy relationship map
- route compatibility tests and migration fixtures

## Explicit non-goals for the first release

- Replacing IDs in database relations or admin mutation payloads
- 3D visualization
- AI-generated student recommendations
- Collaborative notes or discussion threads
- A full Study Planner redesign
- Gamification, streaks, badges, or leaderboards
- Saving arbitrary graph node positions
- Adding filters whose source data is incomplete

## Decision gates

1. **After the data audit:** if fewer than 80% of explorer-ready courses have program placement, omit program and term filters from launch rather than displaying unreliable options.
2. **After the outline prototype:** test with representative BCT and Civil courses, including a shared course and a course with nested topics. Continue only if students can find a requested topic faster than in the current graph.
3. **Before progress storage:** confirm that mark-studied behavior is used and clarify whether topic completion or resource consumption defines progress.
4. **Before removing old components:** verify route analytics and compatibility logs show no unresolved legacy references.

## Recommended first implementation slice

Implement Phases 0 through 3 as the first coherent release. That slice fixes the false controls, unreadable routes, empty-course dead ends, hierarchy bug, mobile layout, and resource discovery without waiting for graph refinement or progress tracking.

The optional map, progress, and deeper instructor work can then build on a student workflow that is already useful.
