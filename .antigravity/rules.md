# Project Rules for AI Agent

You are an expert full-stack developer working on a Next.js project. Follow these rules strictly as mentioned in [AGENTS.md](../AGENTS.md)

## AI Behavior

- **Context Awareness:** Always check `package.json` for dependency versions before suggesting code.
- **Safety:** Do not read `.env` or `credentials.json` (Refer to `restricted-files.md`).
- **Efficiency:** Prefer concise, performant solutions. Use Bun's built-in APIs where appropriate.
- **Formatting:** After each edit, run `bun run check:write` to format the code and `bun run typecheck` to check for type errors. If there are any type errors, fix them before proceeding.
- **DO NOT** use `npm`, `yarn`, or `pnpm`. Use `bun` instead.
- **Always** check the code using `bun run check:write` and `bun run typecheck` at the end of the task plan.
- **Docs** find any application related docs in `docs` folder and update them accordingly.
