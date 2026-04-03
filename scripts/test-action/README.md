# Test Action Scripts

Scripts for invoking and testing App Builder web actions locally or against a deployed environment.

## Prerequisites

- Logged in: `aio auth login`
- Context set: `aio where` should show your org/project/workspace
- `jq` installed (optional — pretty-prints JSON output)

---

## `invoke.sh` — Single action invoker

Invoke any App Builder web action with auth headers automatically applied.

```bash
./scripts/test-action/invoke.sh <package/action> [options]
```

### Options

| Flag           | Description           | Default |
| -------------- | --------------------- | ------- |
| `-m, --method` | HTTP method           | `POST`  |
| `-d, --data`   | JSON body string      | —       |
| `-f, --file`   | JSON body from file   | —       |
| `-e, --env`    | `local` or `deployed` | `local` |

### Environment variables

| Variable     | Description                            | Default                  |
| ------------ | -------------------------------------- | ------------------------ |
| `LOCAL_HOST` | Override the local dev server base URL | `https://localhost:9080` |

### Notes

- GET and DELETE methods automatically convert `-d` JSON to URL query parameters (App Builder does not parse bodies for these methods)
- Auth token and org ID are fetched automatically via `aio auth login` and `aio where`

### Examples

```bash
# GET (no body)
./scripts/test-action/invoke.sh delivery-fee/rules-list -m GET

# POST with JSON body
./scripts/test-action/invoke.sh delivery-fee/rules-create \
  -d '{"country":"US","region":"CA","name":"CA Fee","type":"fixed","value":9.99}'

# DELETE with params (converted to query string)
./scripts/test-action/invoke.sh delivery-fee/rules-delete \
  -m DELETE -d '{"country":"US","region":"CA"}'

# Against deployed environment
./scripts/test-action/invoke.sh delivery-fee/rules-list -m GET -e deployed

# Custom local port
LOCAL_HOST=https://localhost:9081 ./scripts/test-action/invoke.sh \
  commerce-backend-ui-1/registration -m GET
```

---

## `test-admin-ui-phase2.sh` — Admin UI Phase 2 smoke tests

Runs a suite of smoke tests against the `commerce/backend-ui/1` extension: the registration action and the React SPA entry point.

```bash
./scripts/test-action/test-admin-ui-phase2.sh [options]
```

### Options

| Flag     | Description                                      | Default |
| -------- | ------------------------------------------------ | ------- |
| `--port` | Local dev server port for the Admin UI extension | `9080`  |
| `--env`  | `local` or `deployed`                            | `local` |

### Setup

The Admin UI extension and the main application must both be running before executing this script. Because `aio app dev` only runs one extension at a time, use two terminals:

```bash
# Terminal 1 — Phase 1 backend actions
aio app dev -e application

# Terminal 2 — Admin UI extension (use PORT env var if 9080 is taken)
PORT=9081 aio app dev -e commerce/backend-ui/1
```

### Usage

```bash
# Local (default port 9080)
./scripts/test-action/test-admin-ui-phase2.sh

# Local with custom port
./scripts/test-action/test-admin-ui-phase2.sh --port 9081

# Deployed
./scripts/test-action/test-admin-ui-phase2.sh --env deployed
```

### Test coverage

| #   | Scenario                            | What is checked                                                                        |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Registration — happy path           | Response contains `pages`, `delivery-fee-rules`, `Delivery Fees`, `Stores`, `Airplane` |
| 2   | Registration — unauthenticated      | Request without a token is rejected by the App Builder runtime                         |
| 3   | Phase 1 rule actions — reachability | `delivery-fee/rules-list` responds (SPA depends on it)                                 |
| 4   | React SPA — HTML entry point        | `index.html` is served with `<div id="root">`                                          |
