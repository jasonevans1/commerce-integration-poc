#!/usr/bin/env bash
# Test script for admin-ui-phase2: registration action + React SPA smoke test.
#
# Prerequisites:
#   aio app dev   — must be running in a separate terminal before running this script
#
# Usage:
#   ./scripts/test-action/test-admin-ui-phase2.sh
#   ./scripts/test-action/test-admin-ui-phase2.sh --port 9081
#   ./scripts/test-action/test-admin-ui-phase2.sh --env deployed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INVOKE="$SCRIPT_DIR/invoke.sh"

ENV="local"
PORT="9080"
PASS=0
FAIL=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)  ENV="$2";  shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# --- Helpers ---

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

pass() { echo -e "${GREEN}  ✓ PASS${RESET} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}  ✗ FAIL${RESET} $1"; echo "         $2"; FAIL=$((FAIL + 1)); }
header() { echo -e "\n${YELLOW}▶ $1${RESET}"; }

# Run invoke.sh and capture response + HTTP status code.
# Returns the response body; sets LAST_STATUS to the HTTP status code.
invoke() {
  local action="$1"; shift
  # Capture both body and status — append -w to get status on last line
  local raw
  raw=$("$INVOKE" "$action" "$@" -e "$ENV" 2>/dev/null || true)
  LAST_RESPONSE="$raw"
}

assert_contains() {
  local label="$1"
  local needle="$2"
  if echo "$LAST_RESPONSE" | grep -q "$needle"; then
    pass "$label"
  else
    fail "$label" "Expected to find '$needle' in response. Got: $LAST_RESPONSE"
  fi
}

assert_not_contains() {
  local label="$1"
  local needle="$2"
  if ! echo "$LAST_RESPONSE" | grep -q "$needle"; then
    pass "$label"
  else
    fail "$label" "Expected '$needle' NOT to be in response. Got: $LAST_RESPONSE"
  fi
}

export LOCAL_HOST="https://localhost:${PORT}"

check_dev_server() {
  if [[ "$ENV" == "local" ]]; then
    if ! curl -sk --max-time 2 "$LOCAL_HOST" > /dev/null 2>&1; then
      echo -e "${RED}Error:${RESET} Local dev server is not running."
      echo "  Start it first:  aio app dev -e commerce/backend-ui/1 -p $PORT"
      exit 1
    fi
  fi
}

# --- Pre-flight ---

echo ""
echo "================================================="
echo "  Admin UI Phase 2 — Local Test Suite"
echo "  Environment: $ENV (port $PORT)"
echo "================================================="

check_dev_server

# -------------------------------------------------------
# 1. Registration action — happy path
# -------------------------------------------------------
header "1. Registration action — happy path"

invoke "commerce-backend-ui-1/registration" -m GET

assert_contains \
  "returns pages array" \
  '"pages"'

assert_contains \
  "returns id: delivery-fee-rules" \
  '"delivery-fee-rules"'

assert_contains \
  "returns label: Delivery Fees" \
  '"Delivery Fees"'

assert_contains \
  "returns parent: Stores" \
  '"Stores"'

assert_contains \
  "returns icon: Airplane" \
  '"Airplane"'

# -------------------------------------------------------
# 2. Registration action — unauthenticated request
# -------------------------------------------------------
header "2. Registration action — unauthenticated (no token)"

# Call without auth headers directly via curl to verify the runtime blocks it
if [[ "$ENV" == "local" ]]; then
  UNAUTH_URL="${LOCAL_HOST}/api/v1/web/commerce-backend-ui-1/registration"
else
  NAMESPACE=$(aio rt property get --namespace 2>/dev/null | awk '/namespace/{print $NF}' | head -1)
  RT_HOST=$(aio rt property get --apihost 2>/dev/null | awk '/apihost/{print $NF}' | head -1)
  UNAUTH_URL="${RT_HOST}/api/v1/web/${NAMESPACE}/commerce-backend-ui-1/registration"
fi

UNAUTH_RESPONSE=$(curl -sk "$UNAUTH_URL" 2>/dev/null || true)

# The runtime returns a 401 error object or redirects to login
if echo "$UNAUTH_RESPONSE" | grep -qiE '"error"|"code":401|Unauthorized|login'; then
  pass "unauthenticated request is rejected by the runtime"
else
  fail "unauthenticated request should be rejected" \
    "Expected 401/error response. Got: $UNAUTH_RESPONSE"
fi

# -------------------------------------------------------
# 3. Dependency check — Phase 1 rule actions reachable
# -------------------------------------------------------
header "3. Phase 1 rule actions — reachability check"

invoke "delivery-fee/rules-list" -m GET

# rules-list returns an array (even if empty) when healthy
if echo "$LAST_RESPONSE" | grep -qE '^\[|^\{'; then
  pass "rules-list action is reachable"
else
  fail "rules-list action is not reachable" \
    "The React SPA depends on this. Response: $LAST_RESPONSE"
fi

# -------------------------------------------------------
# 4. SPA entry point — HTML is served
# -------------------------------------------------------
header "4. React SPA — HTML entry point"

if [[ "$ENV" == "local" ]]; then
  SPA_URL="${LOCAL_HOST}/index.html"
else
  # Deployed SPA URL is printed by aio app deploy; skip this check
  SPA_URL=""
fi

if [[ -n "$SPA_URL" ]]; then
  SPA_RESPONSE=$(curl -sk "$SPA_URL" 2>/dev/null || true)

  if echo "$SPA_RESPONSE" | grep -q 'id="root"'; then
    pass "index.html is served with <div id=\"root\">"
  else
    fail "index.html missing expected root div" \
      "Got: $(echo "$SPA_RESPONSE" | head -5)"
  fi

  if echo "$SPA_RESPONSE" | grep -qi "<!doctype html\|<html"; then
    pass "response is HTML"
  else
    fail "response does not look like HTML" \
      "Got: $(echo "$SPA_RESPONSE" | head -3)"
  fi
else
  echo "  (SPA URL check skipped for deployed env — verify manually in Commerce Admin)"
fi

# -------------------------------------------------------
# Summary
# -------------------------------------------------------
TOTAL=$((PASS + FAIL))
echo ""
echo "================================================="
echo -e "  Results: ${GREEN}${PASS} passed${RESET} / ${RED}${FAIL} failed${RESET} / ${TOTAL} total"
echo "================================================="
echo ""

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
