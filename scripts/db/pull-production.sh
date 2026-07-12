#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_dump >/dev/null || ! command -v psql >/dev/null; then
  echo "PostgreSQL client tools (pg_dump and psql) are required." >&2
  exit 1
fi

: "${PRODUCTION_DATABASE_URL:?Set PRODUCTION_DATABASE_URL to a read-only production connection string.}"
: "${DATABASE_URL:?Set DATABASE_URL to the local database that will be replaced.}"

case "$DATABASE_URL" in
  postgresql://*localhost*|postgresql://*127.0.0.1*|postgres://*localhost*|postgres://*127.0.0.1*) ;;
  *)
    echo "Refusing to restore into a non-local DATABASE_URL." >&2
    exit 1
    ;;
esac

if [[ "${CONFIRM_DATABASE_REPLACE:-}" != "replace-local-database" ]]; then
  echo "This replaces all data in the local target database." >&2
  echo "Re-run with CONFIRM_DATABASE_REPLACE=replace-local-database." >&2
  exit 1
fi

dump_file="$(mktemp "${TMPDIR:-/tmp}/ioesu-production-XXXXXX.sql")"
trap 'rm -f "$dump_file"' EXIT

echo "Downloading a consistent production data snapshot..."
pg_dump \
  --data-only \
  --schema=public \
  --no-owner \
  --no-acl \
  --file="$dump_file" \
  "$PRODUCTION_DATABASE_URL"

truncate_sql="$(
  psql --dbname="$DATABASE_URL" --tuples-only --no-align --set=ON_ERROR_STOP=1 \
    --command="SELECT CASE WHEN count(*) = 0 THEN 'SELECT 1;' ELSE 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename) || ' RESTART IDENTITY CASCADE;' END FROM pg_tables WHERE schemaname = 'public';"
)"

echo "Replacing local data while preserving the newer local schema..."
psql \
  --dbname="$DATABASE_URL" \
  --set=ON_ERROR_STOP=1 \
  --single-transaction \
  --command="$truncate_sql" \
  --file="$dump_file"

echo "Local data refreshed from production without replacing the local schema. Treat the copied data as sensitive."
