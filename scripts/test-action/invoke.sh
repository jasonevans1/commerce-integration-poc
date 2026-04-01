#!/usr/bin/env bash
# Invoke an App Builder web action locally (aio app dev) or deployed.
#
# Usage:
#   ./scripts/test-action/invoke.sh <package/action> [options]
#
# Options:
#   -m, --method   HTTP method (default: POST)
#   -d, --data     JSON body string
#   -f, --file     JSON body from file
#   -e, --env      Target environment: local (default) | deployed
#   -h, --help     Show this help
#
# Examples:
#   ./scripts/test-action/invoke.sh delivery-fee/calculate \
#     -d '{"country":"US","region":"CA","subtotal":100,"currency":"USD"}'
#
#   ./scripts/test-action/invoke.sh delivery-fee/rules-create \
#     -d '{"country":"US","region":"CA","name":"CA Fee","type":"fixed","value":9.99}'
#
#   ./scripts/test-action/invoke.sh delivery-fee/rules-list
#
#   ./scripts/test-action/invoke.sh delivery-fee/calculate \
#     -e deployed \
#     -d '{"country":"US","region":"CA","subtotal":100,"currency":"USD"}'

set -euo pipefail

# --- Defaults ---
METHOD="POST"
DATA=""
FILE=""
ENV="local"
LOCAL_HOST="https://localhost:9080"

# --- Parse args ---
ACTION=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--method)  METHOD="$2";  shift 2 ;;
    -d|--data)    DATA="$2";    shift 2 ;;
    -f|--file)    FILE="$2";    shift 2 ;;
    -e|--env)     ENV="$2";     shift 2 ;;
    -h|--help)
      sed -n '/^# Usage:/,/^[^#]/p' "$0" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *)  ACTION="$1"; shift ;;
  esac
done

if [[ -z "$ACTION" ]]; then
  echo "Error: action path required (e.g. delivery-fee/calculate)" >&2
  echo "Usage: $0 <package/action> [options]" >&2
  exit 1
fi

# --- Auth headers ---
echo "Getting auth token..." >&2
TOKEN=$(aio auth token 2>/dev/null) || { echo "Error: not logged in. Run 'aio login' first." >&2; exit 1; }

echo "Getting org ID..." >&2
ORG_NAME=$(aio where --json 2>/dev/null | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -z "$ORG_NAME" ]]; then
  echo "Error: could not determine current org. Run 'aio where' to check your context." >&2
  exit 1
fi
ORG_ID=$(aio console org list --json 2>/dev/null | python3 -c "
import sys, json
orgs = json.load(sys.stdin)
name = '$ORG_NAME'
match = next((o for o in orgs if o.get('name') == name), None)
print(match['code'] if match else '')
" 2>/dev/null)
if [[ -z "$ORG_ID" ]]; then
  echo "Error: could not find org code for '$ORG_NAME'." >&2
  echo "Run: aio console org list --json | jq -r '.[] | select(.name == \"$ORG_NAME\") | .code'" >&2
  exit 1
fi

# --- Build URL ---
if [[ "$ENV" == "local" ]]; then
  BASE_URL="$LOCAL_HOST/api/v1/web"
else
  # Deployed: get namespace from aio runtime
  NAMESPACE=$(aio rt property get --namespace 2>/dev/null | awk '/namespace/{print $NF}' | head -1)
  if [[ -z "$NAMESPACE" ]]; then
    echo "Error: could not determine runtime namespace." >&2
    exit 1
  fi
  RT_HOST=$(aio rt property get --apihost 2>/dev/null | awk '/apihost/{print $NF}' | head -1)
  BASE_URL="${RT_HOST}/api/v1/web/${NAMESPACE}"
fi

URL="${BASE_URL}/${ACTION}"

# --- Build curl command ---
CURL_ARGS=(-sk -X "$METHOD")
CURL_ARGS+=(-H "Authorization: Bearer $TOKEN")
CURL_ARGS+=(-H "x-gw-ims-org-id: $ORG_ID")

if [[ -n "$FILE" ]]; then
  CURL_ARGS+=(-H "Content-Type: application/json")
  CURL_ARGS+=(--data-binary "@$FILE")
elif [[ -n "$DATA" ]]; then
  CURL_ARGS+=(-H "Content-Type: application/json")
  CURL_ARGS+=(-d "$DATA")
fi

# --- Invoke ---
echo "" >&2
echo "→ $METHOD $URL" >&2
echo "" >&2

if command -v jq &>/dev/null; then
  curl "${CURL_ARGS[@]}" "$URL" | jq
else
  curl "${CURL_ARGS[@]}" "$URL"
fi
