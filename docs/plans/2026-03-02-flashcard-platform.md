# End-to-End Flashcard Platform Implementation Plan (DB + CRUD APIs + UI + MCP Tools)

## Summary
Build a full flashcard content and learning platform with quiz-level parity, plus advanced spaced repetition (SRS) in v1:
- Normalized DB schema for deck authoring, card content, and learner review progress
- Complete CRUD APIs for decks/cards/tags and full study session lifecycle APIs
- Learner-facing flashcard experience and admin management dashboard
- MCP tools for AI-agent-driven deck creation, editing, validation, publishing, and bulk operations

## Data Source Alignment
Use `assets/yolox-flashcards.json` as the canonical example payload shape for flashcard content ingestion:
- Deck-level: `title`
- Card-level: `cards[].front`, `cards[].back`

Any additional fields in DB/API (tags, SRS metadata, publish status, hints, explanation, media) are extensions on top of this baseline input format.

## Public API / Interface Changes
- New DB entities:
  - `flashcard_decks`
  - `flashcard_cards`
  - `flashcard_tags`
  - `flashcard_deck_tags`
  - `flashcard_study_sessions`
  - `flashcard_reviews`
  - `flashcard_user_card_states`
- New Elysia route module:
  - `src/server/elysia/routes/flashcards.ts`
- New MCP module:
  - `src/server/mcp/tools/flashcards.ts`
- New frontend routes:
  - Learner: `src/app/flashcards/page.tsx`, `src/app/flashcards/[slug]/page.tsx`
  - Admin: `src/app/(protected)/dashboard/flashcards/page.tsx`, `src/app/(protected)/dashboard/flashcards/new/page.tsx`, `src/app/(protected)/dashboard/flashcards/[id]/page.tsx`
- Shared types:
  - `src/types/flashcard-platform.ts`

## Database Design
Implemented with support for draft/publish workflow, tag taxonomy, session history, and per-user materialized SRS state.

## API Design
Implemented complete deck/card/tag CRUD, publish lifecycle endpoints, and session/review lifecycle endpoints supporting both authenticated and guest study mode.

## SRS Service
Implemented `sm2` and `fsrs` strategy keys with a common output contract via:
- `src/server/services/flashcard-srs.ts`

## MCP Tools
Implemented flashcard toolset for list/get/create/update/publish/archive/clone, card operations, tag assignment, validation, bulk upsert, and schedule simulation.

## Quality Gates
- Run `bun run db:generate`
- Run `bun run db:migrate`
- Run `bun run check:write`
- Run `bun run typecheck`
