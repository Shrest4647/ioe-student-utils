#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_dump >/dev/null || ! command -v pg_restore >/dev/null || ! command -v psql >/dev/null; then
  echo "PostgreSQL client tools (pg_dump, pg_restore, and psql) are required." >&2
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

dump_file="$(mktemp "${TMPDIR:-/tmp}/ioesu-production-XXXXXX.dump")"
trap 'rm -f "$dump_file"' EXIT

echo "Downloading a consistent production snapshot..."
pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$dump_file" \
  "$PRODUCTION_DATABASE_URL"

echo "Replacing the local database contents..."
psql --dbname="$DATABASE_URL" --set=ON_ERROR_STOP=1 \
  --command='DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
pg_restore \
  --no-owner \
  --no-acl \
  --exit-on-error \
  --dbname="$DATABASE_URL" \
  "$dump_file"

echo "Local database refreshed from production. Treat the copied data as sensitive."
