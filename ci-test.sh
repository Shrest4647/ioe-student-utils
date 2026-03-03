#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

show_help() {
  cat <<'EOF'
Usage: ./ci-test.sh [options]

Options:
  -I, --run-integration   Run integration tests (non-MCP) after unit tests.
  -M, --run-mcp           Run MCP tests after selected test phases.
  -h, --help              Show this help message.

Environment:
  RUN_INTEGRATION_TESTS=1 Also enables integration tests (backward compatible).
  RUN_MCP_TESTS=1         Also enables MCP tests.
  TEST_MCP_URL            Preferred MCP endpoint for MCP tests (CI-friendly).
  TEST_MCP_API_KEY        Preferred MCP API key for MCP tests (CI-friendly).
  MCP_URL                 Fallback MCP endpoint if TEST_MCP_URL is unset.
  MCP_API_KEY             Fallback MCP key if TEST_MCP_API_KEY is unset.

Examples:
  ./ci-test.sh
  ./ci-test.sh -I
  ./ci-test.sh -M
  ./ci-test.sh -I -M
EOF
}

run_integration="${RUN_INTEGRATION_TESTS:-0}"
run_mcp="${RUN_MCP_TESTS:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -I|--run-integration)
      run_integration=1
      shift
      ;;
    -M|--run-mcp)
      run_mcp=1
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help >&2
      exit 1
      ;;
  esac
done

if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is not installed or not in PATH." >&2
  exit 1
fi

echo "==> Typecheck"
bun run typecheck

echo "==> Unit tests"
mapfile -t UNIT_TEST_FILES < <(
  find test -type f -name "*.test.ts" \
    ! -path "test/integration/*" \
    ! -path "test/mcp-auth.test.ts" \
    | sort
)
if [[ "${#UNIT_TEST_FILES[@]}" -eq 0 ]]; then
  echo "No unit test files found under test/."
  exit 1
fi

bun test --bail "${UNIT_TEST_FILES[@]}"

if [[ "$run_integration" == "1" ]]; then
  echo "==> Integration tests (non-MCP)"
  mapfile -t INTEGRATION_TEST_FILES < <(
    find test/integration -type f -name "*.test.ts" \
      ! -path "test/integration/mcp/*" \
      | sort
  )
  if [[ "${#INTEGRATION_TEST_FILES[@]}" -eq 0 ]]; then
    echo "No non-MCP integration test files found under test/integration/."
  else
    bun test --bail "${INTEGRATION_TEST_FILES[@]}"
  fi
else
  echo "==> Integration tests skipped (use -I/--run-integration to enable)"
fi

if [[ "$run_mcp" == "1" ]]; then
  echo "==> MCP tests"
  export MCP_URL="${TEST_MCP_URL:-${MCP_URL:-http://localhost:3000/api/mcp/mcp}}"
  export MCP_API_KEY="${TEST_MCP_API_KEY:-${MCP_API_KEY:-YOUR_API_KEY_HERE}}"

  echo "MCP_URL=$MCP_URL"
  if [[ "$MCP_API_KEY" == "YOUR_API_KEY_HERE" ]]; then
    echo "MCP_API_KEY is placeholder (set TEST_MCP_API_KEY or MCP_API_KEY for authenticated MCP tests)."
  else
    echo "MCP_API_KEY is set."
  fi

  mapfile -t MCP_TEST_FILES < <(
    {
      [[ -f test/mcp-auth.test.ts ]] && echo "test/mcp-auth.test.ts"
      find test/integration/mcp -type f -name "*.test.ts" 2>/dev/null || true
    } | sort
  )

  if [[ "${#MCP_TEST_FILES[@]}" -eq 0 ]]; then
    echo "No MCP test files found."
  else
    bun test --bail "${MCP_TEST_FILES[@]}"
  fi
else
  echo "==> MCP tests skipped (use -M/--run-mcp to enable)"
fi

echo "CI test workflow completed successfully."
