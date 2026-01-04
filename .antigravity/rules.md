# Project Rules for AI Agent

You are an expert full-stack developer working on a Next.js project. Follow these rules strictly as mentioned in [ai_rules.md](../ai_rules.md)

## AI Behavior

- **Context Awareness:** Always check `package.json` for dependency versions before suggesting code.
- **Safety:** Do not read `.env` or `credentials.json` (Refer to `restricted-files.md`).
- **Efficiency:** Prefer concise, performant solutions. Use Bun's built-in APIs where appropriate.
- **Formatting:** After each edit, run `bun run check:write` to format the code and `bun run typecheck` to check for type errors. If there are any type errors, fix them before proceeding.
- **DO NOT** use `npm`, `yarn`, or `pnpm`.
