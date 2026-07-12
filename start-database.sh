#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

env_file=".env.neon-local"
compose_file="compose.neon-local.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install it from https://docs.docker.com/engine/install/" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is required." >&2
  exit 1
fi

if [[ ! -f "$env_file" ]]; then
  cp .env.neon-local.example "$env_file"
  echo "Created $env_file. Add NEON_API_KEY and NEON_PROJECT_ID, then run this command again." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

: "${NEON_API_KEY:?Set NEON_API_KEY in $env_file}"
: "${NEON_PROJECT_ID:?Set NEON_PROJECT_ID in $env_file}"

database_name="ioesu-db-prod"
port="${NEON_LOCAL_PORT:-5432}"
database_url="postgres://neon:npg@localhost:${port}/${database_name}?sslmode=require"

# Neon Local runs as an unprivileged container user and needs to persist its
# per-Git-branch mapping in this ignored directory.
mkdir -p .neon_local
chmod 0777 .neon_local

docker compose --env-file "$env_file" --file "$compose_file" up --detach --wait db

if [[ ! -f .env.development.local ]]; then
  printf 'DATABASE_URL=%s\n' "$database_url" > .env.development.local
  echo "Created .env.development.local with the static Neon Local URL."
fi

echo "Applying pending migrations to the isolated development branch..."
DATABASE_URL="$database_url" bun run db:migrate

echo
echo "Neon Local is ready."
echo "DATABASE_URL=$database_url"
