# Database workflow

The application uses committed Drizzle SQL migrations as the database change log. Local and production databases contain different data, but they must reach the same schema by applying the same files under `drizzle/`.

## One-time GitHub setup

1. In GitHub, create an environment named `production`.
2. Add an environment secret named `PRODUCTION_DATABASE_URL`. Use a Neon connection string for the production database. Prefer Neon's direct connection endpoint for migrations rather than a pooled runtime endpoint.
3. Protect the environment with required reviewers if production changes need an approval gate.
4. Keep the application runtime `DATABASE_URL` in Vercel; do not copy it into the repository.

The `Production database migration` action runs after migration-related files land on `main`. Runs are serialized, and Drizzle records applied migrations in the database, so an already-applied migration is not run again. The action can also be started manually from GitHub Actions for recovery.

## Making a schema change

1. Edit the schema under `src/server/db/schema.ts` or `src/server/db/schema/`.
2. Generate the SQL migration:

   ```sh
   bun run db:generate
   ```

3. Review the new `drizzle/<timestamp>_<name>/migration.sql`. Pay particular attention to destructive statements, locks, new non-null columns, and large-table rewrites.
4. Apply it to the local database:

   ```sh
   bun run db:migrate
   ```

5. Test the application and commit both the schema changes and generated `drizzle/` files. Do not use `db:push` against production.
6. After the pull request is merged, watch both the GitHub migration action and the Vercel deployment.

Vercel and GitHub react to the merge independently. Therefore schema changes must use an expand/contract rollout:

- First deploy an additive migration and code that works with both old and new schemas.
- Backfill data in a separate, restartable operation when needed.
- Switch application reads/writes only after the new schema is live.
- Remove old columns or constraints in a later pull request.

If a production migration fails, the workflow stops and Vercel may already have deployed the merged code. Make the application change backward compatible, inspect the action log, fix the migration with a new forward migration, and rerun the action. Do not edit a migration that has already run in any shared database.

## Refreshing local data from production

Install PostgreSQL client tools and ensure the local database is running. Use a read-only Neon role for the source connection where possible, then run:

```sh
PRODUCTION_DATABASE_URL='postgresql://readonly:...@.../production?sslmode=require' \
DATABASE_URL='postgresql://postgres:password@localhost:5432/ioesu_db' \
CONFIRM_DATABASE_REPLACE=replace-local-database \
bun run db:pull-production
```

The command creates a temporary custom-format dump, replaces the contents of the local database, and deletes the dump on exit. It refuses non-local targets. The source URL is passed only through the environment and must never be added to `.env`, shell history, logs, or GitHub.

Production copies contain user, account, session, uploaded-resource metadata, and other personal data. Use access controls appropriate for production data, never send email or OAuth callbacks from the copy, and prefer a sanitized dataset when contributors do not have production-data authorization. Copying rows does not copy Neon roles or Vercel secrets, but active session/account records remain sensitive.

For frequent or team-wide refreshes, prefer a Neon branch created from production instead of distributing dumps. Give each developer a separate branch and point their local `DATABASE_URL` at it; this keeps production isolated and uses Neon's copy-on-write workflow. The local dump command remains useful when offline development or a truly local PostgreSQL instance is required.
