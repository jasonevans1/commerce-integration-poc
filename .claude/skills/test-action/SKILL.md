---
name: test-action
description: Generates invoke commands for manually testing App Builder web actions locally or deployed. Use when the user wants to test an action, invoke an endpoint, or verify behaviour after implementation.
argument-hint: "[package/action] [optional: describe what to test]"
---

# Test Action

Generate and run invoke commands for App Builder web actions using the project's `scripts/test-action/invoke.sh` helper.

## What This Skill Does

1. Identifies the action(s) to test from the user's request or recent implementation
2. Constructs the correct invocation commands using the invoke script
3. Covers: happy path, validation errors, edge cases, and no-match scenarios
4. Reminds the user to start `aio app dev` if testing locally

## Prerequisites

Check that the local dev server is running. If not, remind the user:

```bash
# In a separate terminal — keep it running
aio app dev
```

## Invoke Script Usage

```bash
# POST with JSON body (most actions)
./scripts/test-action/invoke.sh <package/action> -d '<json>'

# GET (no body)
./scripts/test-action/invoke.sh <package/action> -m GET

# DELETE with params — automatically converted to query string (App Builder does not parse DELETE bodies)
./scripts/test-action/invoke.sh <package/action> -m DELETE -d '{"country":"US","region":"CA"}'
# → https://localhost:9080/api/v1/web/<package/action>?country=US&region=CA

# Against deployed environment instead of local
./scripts/test-action/invoke.sh <package/action> -e deployed -d '<json>'

# Body from file
./scripts/test-action/invoke.sh <package/action> -f ./payload.json
```

The script automatically:

- Fetches `aio auth token`
- Fetches the org ID from `aio where`
- Adds `Authorization` and `x-gw-ims-org-id` headers
- Pretty-prints JSON output if `jq` is installed

## How to Generate Test Commands

For each action being tested, generate commands covering:

### 1. Happy Path

The primary success scenario with valid inputs.

### 2. Validation Errors

One command per required field — omit it to trigger a 400.

### 3. Edge Cases

- Boundary values (e.g. percentage = 100, subtotal = 0.01)
- Case normalization (e.g. lowercase country/region)
- Idempotency (e.g. calling delete twice)

### 4. No-Match / Empty State

For lookup actions, test when the resource doesn't exist.

### 5. Chained Flows

For related actions (e.g. create → get → delete), show the full sequence.

## Example Output Format

Present commands grouped by scenario:

```
## Setup — start dev server (separate terminal)
aio app dev

## 1. Create a rule
./scripts/test-action/invoke.sh delivery-fee/rules-create \
  -d '{"country":"US","region":"CA","name":"CA Fee","type":"fixed","value":9.99}'

## 2. Calculate — matching rule
./scripts/test-action/invoke.sh delivery-fee/calculate \
  -d '{"country":"US","region":"CA","subtotal":100,"currency":"USD"}'
# Expected: { fee: 9.99, name: "CA Fee", currency: "USD" }

## 3. Calculate — no match
./scripts/test-action/invoke.sh delivery-fee/calculate \
  -d '{"country":"GB","region":"ENG","subtotal":100,"currency":"GBP"}'
# Expected: { fee: 0, name: "No delivery fee applies", currency: "GBP" }

## 4. Validation — missing required field
./scripts/test-action/invoke.sh delivery-fee/calculate \
  -d '{"region":"CA","subtotal":100,"currency":"USD"}'
# Expected: 400 { error: "country is required" }

## 5. Cleanup
./scripts/test-action/invoke.sh delivery-fee/rules-delete \
  -m DELETE -d '{"country":"US","region":"CA"}'
```

## Reading Action Config

Before generating commands, read the action's config and handler files to determine:

- HTTP method conventions used (`web: 'yes'` actions accept any method)
- Required input params (from `validator.js`)
- Expected response shape (from `post.js`)
- Whether auth is required (`require-adobe-auth`)

## Notes

- Auth headers are always sent by the script; they're ignored for public (`require-adobe-auth: false`) actions
- Local dev does NOT persist I/O State between `aio app dev` restarts
- **GET and DELETE methods**: App Builder does not parse JSON request bodies for these methods. The script automatically converts `-d '<json>'` to URL query parameters (e.g. `?country=US&region=CA`) when method is GET or DELETE
