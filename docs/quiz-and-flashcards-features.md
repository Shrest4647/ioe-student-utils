# Quiz (Grease) and Flashcards: Feature Documentation

This document describes the newly implemented learning platform features for:
- Quiz platform
- Flashcards platform

If "Grease" refers to a different module name than Quiz, update this file title and section naming accordingly.

## 1) What Was Added

### Quiz platform
- Full data model for quiz authoring, publishing, attempts, and per-question answers.
- Public learner quiz catalog and play experience.
- Admin dashboard for quiz CRUD and publishing workflow.
- MCP tools for AI-agent quiz operations (create/edit/publish/validate/bulk/clone).

### Flashcards platform
- Full data model for deck authoring, publishing, tags, sessions, review events, and per-user SRS state.
- Learner deck catalog and runtime flashcard study experience.
- Admin dashboard for deck/card/tag CRUD and publishing workflow.
- MCP tools for AI-agent flashcard operations (create/edit/publish/validate/bulk/clone/simulate schedule).
- SRS service supporting `sm2` and `fsrs` strategy keys.

## 2) Database Model

### Quiz tables
Defined in: `src/server/db/schema/quizzes.ts`
- `quizzes`
- `quiz_questions`
- `quiz_options`
- `quiz_attempts`
- `quiz_attempt_answers`

Purpose:
- Authoring and publishing quiz content
- Storing learner attempts and answer history

### Flashcard tables
Defined in: `src/server/db/schema/flashcards.ts`
- `flashcard_decks`
- `flashcard_cards`
- `flashcard_tags`
- `flashcard_deck_tags`
- `flashcard_study_sessions`
- `flashcard_reviews`
- `flashcard_user_card_states`

Purpose:
- Authoring/publishing decks
- Tagging decks
- Tracking study sessions and review events
- Materializing SRS state per user/card

### Relations
Defined in: `src/server/db/relations.ts`
- User relations for quiz ownership/attempts and flashcard ownership/sessions/reviews/SRS states
- Deck/card/tag/session/review/state relation graph

## 3) Seed Data

### Quiz seed
- File: `src/server/db/seeders/seed-quizzes.ts`
- Includes sample published quiz with questions/options.

### Flashcard seed
- File: `src/server/db/seeders/seed-flashcards.ts`
- Uses `assets/yolox-flashcards.json` as canonical input shape:
  - `title`
  - `cards[].front`
  - `cards[].back`

Seeder wiring:
- `src/server/db/seeders/seed.ts` now invokes both quiz and flashcard seeds.

## 4) API Surface (Elysia)

## Quiz APIs
Route module: `src/server/elysia/routes/quizzes.ts`

Public/read/play:
- `GET /api/quizzes`
- `GET /api/quizzes/slug/:slug`
- `GET /api/quizzes/id/:id`
- `POST /api/quizzes/quiz/:quizId/attempts`
- `PATCH /api/quizzes/attempts/:attemptId/answer`
- `POST /api/quizzes/attempts/:attemptId/complete`
- `GET /api/quizzes/attempts/:attemptId`
- `DELETE /api/quizzes/attempts/:attemptId`
- `GET /api/quizzes/quiz/:quizId/my-attempts`
- `GET /api/quizzes/quiz/:quizId/attempts` (admin)

Admin/content:
- `POST /api/quizzes/admin`
- `PATCH /api/quizzes/admin/:id`
- `DELETE /api/quizzes/admin/:id` (archive)
- `POST /api/quizzes/admin/:id/publish`
- `POST /api/quizzes/admin/:id/unpublish`
- Question CRUD/reorder endpoints
- Option CRUD/reorder endpoints

## Flashcard APIs
Route module: `src/server/elysia/routes/flashcards.ts`

Public/read/study:
- `GET /api/flashcards`
- `GET /api/flashcards/slug/:slug`
- `GET /api/flashcards/id/:id`
- `POST /api/flashcards/:deckId/sessions`
- `GET /api/flashcards/:deckId/due`
- `PATCH /api/flashcards/sessions/:sessionId/review`
- `POST /api/flashcards/sessions/:sessionId/complete`
- `GET /api/flashcards/sessions/:sessionId`
- `DELETE /api/flashcards/sessions/:sessionId`
- `GET /api/flashcards/:deckId/sessions`

Admin/content:
- `POST /api/flashcards/admin`
- `PATCH /api/flashcards/admin/:id`
- `DELETE /api/flashcards/admin/:id` (archive)
- `POST /api/flashcards/admin/:id/publish`
- `POST /api/flashcards/admin/:id/unpublish`
- `POST /api/flashcards/admin/:id/clone`
- Card CRUD/reorder/bulk-upsert endpoints
- Tag CRUD and deck-tag assignment endpoints
- Deck validation endpoint

### API conventions
- Request validation uses TypeBox (`t.Object(...)`)
- Response shape:
  - Success: `{ success: true, data: ... }`
  - Failure: `{ success: false, error: "..." }`

## 5) Learner UI

### Quiz
- Catalog: `src/app/quiz/page.tsx`
- Play page: `src/app/quiz/[slug]/page.tsx`
- Runtime components: `src/components/quiz/*`

Behavior:
- Start -> question flow -> completion summary
- Correct answer reveal support in runtime flow
- Attempt history displayed before starting and after completion for logged-in users
- Logged-in user can delete own attempts

### Flashcards
- Catalog: `src/app/flashcards/page.tsx`
- Study page: `src/app/flashcards/[slug]/page.tsx`
- Runtime components: `src/components/flashcard/*` (existing + new)

Behavior:
- Start session -> flip cards -> rate each card (`again|hard|good|easy`) -> completion summary
- Logged-out users can study in session-local mode
- Logged-in users persist review/session progress to server
- Session history displayed before start and after completion for logged-in users
- Logged-in user can delete own session history entries

## 6) Admin UI

### Quiz admin
- List: `src/app/(protected)/dashboard/quizzes/page.tsx`
- New: `src/app/(protected)/dashboard/quizzes/new/page.tsx`
- Edit: `src/app/(protected)/dashboard/quizzes/[id]/page.tsx`

### Flashcards admin
- List: `src/app/(protected)/dashboard/flashcards/page.tsx`
- New: `src/app/(protected)/dashboard/flashcards/new/page.tsx`
- Edit: `src/app/(protected)/dashboard/flashcards/[id]/page.tsx`

Access control:
- Admin routes are wrapped by `RoleGuard allowedRoles={["admin"]}`.

## 7) MCP Tools

### Quiz MCP tools
File: `src/server/mcp/tools/quizzes.ts`

Implemented tools include:
- `fetch_quizzes`
- `get_quiz_by_id`
- `get_quiz_by_slug`
- `create_quiz`
- `update_quiz`
- `archive_quiz`
- `publish_quiz`
- `unpublish_quiz`
- `create_question`
- `update_question`
- `delete_question`
- `create_option`
- `update_option`
- `delete_option`
- `reorder_questions`
- `reorder_options`
- `bulk_upsert_quiz_content`
- `validate_quiz_content`
- `clone_quiz`

### Flashcards MCP tools
File: `src/server/mcp/tools/flashcards.ts`

Implemented tools include:
- `fetch_flashcard_decks`
- `get_flashcard_deck_by_id`
- `get_flashcard_deck_by_slug`
- `create_flashcard_deck`
- `update_flashcard_deck`
- `archive_flashcard_deck`
- `publish_flashcard_deck`
- `unpublish_flashcard_deck`
- `clone_flashcard_deck`
- `create_flashcard_card`
- `update_flashcard_card`
- `delete_flashcard_card`
- `reorder_flashcard_cards`
- `bulk_upsert_flashcard_content`
- `validate_flashcard_content`
- `create_flashcard_tag`
- `assign_flashcard_tags`
- `simulate_srs_schedule`

Permissions mapping:
- File: `src/server/mcp/auth.ts`
- Added `quizzes` and `flashcards` resource mappings for read/write/delete granularity.

## 8) Navigation Integration

Updated navbar routes in: `src/components/common/navbar.tsx`
- Public nav includes Quiz and Flashcards entries.
- Dashboard nav includes Quizzes and Flashcards management links.

## 9) SRS Implementation Details (Flashcards)

Service: `src/server/services/flashcard-srs.ts`

Core contract:
- `computeNextState(policy, previous, rating, now)`

Notes:
- Supports strategy keys `sm2` and `fsrs`.
- Review writes update:
  - review event (`flashcard_reviews`)
  - materialized user card state (`flashcard_user_card_states`)
  - aggregate session counters (`flashcard_study_sessions`)

## 10) Operational Notes

### Important implementation conventions
- Drizzle v2 query style and centralized `defineRelations` usage are required.
- Keep Elysia route paths stable to preserve Eden client typing.
- MCP tools should return strict machine-friendly JSON in `content[].text`.

### Commands
- Format/lint:
  - `bun run check:write`
- Typecheck:
  - `bun run typecheck`
- Migration generation:
  - `bun run db:generate`
- Migration apply:
  - `bun run db:migrate`

### Environment caveat
Some commands/tests require full env vars (auth, database, S3, resend). Missing env will fail process startup before tests execute.

## 11) Related Plan Docs
- Quiz plan: `docs/plans/2026-02-12-quiz-component.md`
- Flashcards plan: `docs/plans/2026-03-02-flashcard-platform.md`
