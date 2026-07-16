# Adaptive flashcards architecture

## Product outcome

Flashcards should behave like a learning queue, not a slideshow. A learner starts with the most useful next card, reveals the answer, gives one confidence rating, and immediately moves on. The same flow must work with touch, keyboard, mouse, intermittent connectivity, and across signed-in devices.

## Current implementation audit

- The learner player always consumes `deck.cards` in authoring order. The existing due endpoint also falls back to ordered cards, so most sessions repeat the same sequence.
- Rating and advancing are separate actions. Advancing without a rating silently records `good`, and an explicitly rated card can be submitted again when Next is pressed.
- The browser cache stores a cursor and session ratings, not durable per-card scheduling state. Anonymous learners therefore cannot build a long-term schedule.
- Guest sessions can be written to the server, but they are not owned by a stable learner identity and cannot be migrated after sign-in.
- The `fsrs` strategy is an SM-2 result with an interval multiplier. It does not model retrievability or meaningfully use stability and difficulty.
- Scheduling ignores daily new-card limits, confidence preferences, overdue severity, lapse history, and session-level randomization.
- Server review mutations have no client idempotency key. Retries can duplicate reviews and advance scheduling twice.
- Progress is limited to the current card, percentage, and a session list. There is no mastery, retention, streak, trend, difficult-card, or upcoming-review view.
- Rich content is inserted as HTML and relies on a global KaTeX object that is not loaded by the component. Media metadata is not rendered.
- The fixed-height flip card, small controls, and click-first copy are weak on phones, for long content, and for assistive technology.

## Architecture

### Scheduling core

`flashcard-srs.ts` remains a pure module shared by the API and browser. It owns state transitions, confidence-to-rating mapping, retrievability estimates, and interval previews. A separate pure queue builder ranks due cards by overdue pressure, difficulty, lapses, and low retrievability, then mixes in a limited, seeded set of new cards. Random and cram modes are explicit alternatives.

### Persistence and sync

- Every browser review is written first to a versioned local deck record containing card states, an append-only review outbox, preferences, and recent session summaries.
- Every review has a `clientReviewId`. Authenticated API writes use it as an idempotency key.
- Successful writes mark outbox entries synced. Failed writes remain available for retry.
- After authentication, the client sends unsynced local reviews in chronological order. The server applies each unseen review transactionally, updates scheduling state, and returns the canonical states.
- Server reviews and card state remain the cross-device source of truth. Local state keeps the interface responsive and usable during transient outages.

### Data model

- `flashcard_reviews`: add nullable unique `client_review_id`, confidence value, and study mode.
- `flashcard_user_deck_preferences`: one row per user and deck for study mode, scheduling aggressiveness, confidence scale, daily limits, auto-advance, hint behavior, and density.
- Existing study sessions remain aggregate records. Reviews remain immutable evidence. User-card states remain the materialized schedule.

### API surface

- Study queue: returns seeded adaptive ordering, counts, and interval context.
- Preferences: read and update per-deck learner settings.
- Review: accepts idempotency and confidence metadata and returns the next schedule.
- Local migration: imports an ordered review outbox after sign-in.
- Insights: returns mastery, retention, streak, trends, difficult cards, upcoming reviews, time, and completion.

## UX contract

- Before study: show due, new, and estimated-time counts; put Start review first; keep settings inline.
- During study: one focused content surface, visible queue state, a large reveal target, then confidence buttons that rate and advance in one action.
- Keyboard: Space reveals; 1–4 rate; H toggles the hint; S opens settings; Escape exits settings.
- Touch: swipe horizontally between prompt and answer only when it cannot conflict with content scrolling. Rating controls stay in the reachable lower portion of the screen.
- Rich content: Markdown, fenced code, math, images, audio, video, and diagrams render in a responsive content region with accessible fallbacks.
- After study: summarize recall and time, identify the next review, and offer a short follow-up without forcing navigation.

## Operational constraints

- Use semantic theme tokens and existing shadcn components.
- Respect reduced motion and avoid layout animation.
- Keep the scheduling and queue modules deterministic under an injected time and seed so they can be unit tested.
- Add new schema fields with nullable or defaulted values so production-derived local databases can migrate safely.
