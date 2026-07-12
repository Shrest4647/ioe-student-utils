# Agent Implementation Notes (Read Before Coding)

Practical memory for future agents. Keep this strict and actionable.

## 1) Stack + Style Defaults
- Runtime/package manager: `bun` only.
- API framework: Elysia in Next App Router (`api.fetch` style integration).
- Validation: TypeBox (`t.Object(...)`) on route inputs.
- Response contract: always `{ success: true, data }` or `{ success: false, error }`.
- File names: kebab-case.

## 2) Drizzle v2 Rules (Critical)
- `db.query.*.findFirst/findMany`: use object-style query options.
- Query-builder (`db.select()/update()/delete()`): expression style is fine.
- Relations must stay centralized in `src/server/db/relations.ts` with `defineRelations(...)`.
- Do not mix v1 relation patterns into v2 code.

## 3) Elysia + Eden Route Stability
- Avoid ambiguous dynamic segments at same depth.
- Prefer explicit static disambiguators:
  - `/.../id/:id`
  - `/.../slug/:slug`
  - `/.../quiz/:quizId/...` or `/.../deck/:deckId/...`
- Reason: Eden route typing breaks when sibling dynamic paths collide.

## 4) MCP Implementation Conventions
- Tool output must be strict MCP text blocks:
  - `content: [{ type: "text" as const, text: "...json..." }]`
  - include `isError: true` on failures.
- For deeply nested Eden clients in MCP tools, `const client = api as any` is acceptable.
- Always normalize API errors with a helper (`unwrap` pattern).
- Add every new tool to `TOOL_PERMISSIONS` in `src/server/mcp/auth.ts` in the same change.

## 5) Content Platform Pattern (Quiz + Flashcards)
- Public read/play/study, admin write/publish/archive.
- Enforce authorization in API (`role: "admin"`), not just UI guards.
- Publish validation must be server-side and deterministic.

## 6) UX Preferences Captured
- Logged-out users must be able to fully experience quiz/flashcard runtime.
- Persistence/history is for logged-in users; guests can be prompted to sign in at end.
- History lists (attempts/sessions) should show:
  - before start
  - after completion
  - not during in-progress flow.
- Users should be able to delete their own attempt/session history entries.
- When answer/review feedback is expected, show it immediately and clearly.

## 7) Flashcard-Specific Data Preference
- Canonical sample structure comes from `assets/yolox-flashcards.json`:
  - `title`
  - `cards[].front`
  - `cards[].back`
- DB/API may extend this with tags, metadata, SRS settings, publish states, etc.
- Seeders should import this structure directly for realism.

## 8) Seeder Pattern
- Keep seed logic exportable (e.g., `export async function seedX()`), then call from central `seed.ts`.
- Avoid standalone auto-running side effects in imported seeder modules.

## 9) Verification Reality in This Repo
- `bun run typecheck` may fail from unrelated pre-existing files; isolate and report whether new files are clean.
- `bun run db:generate`, tests, and server boot can fail without full env vars; treat as environment blockers unless feature code is implicated.

## 10) Minimum Hand-off Checklist
1. `bun run check:write`
2. `bun run typecheck` (report unrelated blockers explicitly)
3. Run targeted tests for changed feature area
4. Confirm API paths and MCP tool names match exactly
5. Confirm navbar/admin navigation entries are wired for new surfaces
