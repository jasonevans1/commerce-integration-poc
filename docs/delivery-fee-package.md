# Delivery Fee Package

Custom delivery fee engine for Adobe Commerce using Adobe I/O State for rule persistence and a synchronous Commerce webhook for checkout injection. Rules are managed via a protected REST-style API and applied at cart-total time via a JSON Patch webhook.

## Overview

The `delivery-fee` package has two responsibilities:

1. **Rule management** — CRUD API for defining per-region fee rules stored in Adobe I/O State
2. **Webhook integration** — A synchronous Commerce webhook that reads the active rule for a cart's shipping address and injects the fee into the cart totals as a `delivery_fee` total segment

### Actions

| Action                | Method / Trigger | Auth       | Purpose                                                  |
| --------------------- | ---------------- | ---------- | -------------------------------------------------------- |
| `calculate`           | GET (web)        | **public** | Standalone fee calculation for a country/region/subtotal |
| `rules-create`        | POST (web)       | Adobe auth | Create or overwrite a fee rule                           |
| `rules-get`           | GET (web)        | Adobe auth | Retrieve a single rule by country + region               |
| `rules-list`          | GET (web)        | Adobe auth | List all stored rules                                    |
| `rules-delete`        | DELETE (web)     | Adobe auth | Delete a rule by country + region                        |
| `webhook-quote-total` | Commerce webhook | **public** | Inject delivery fee into cart totals at checkout         |

## Architecture

```
Commerce checkout
      │
      │  POST (synchronous webhook)
      ▼
webhook-quote-total ──── I/O State ──── delivery_fee rule
      │                                   (keyed by COUNTRY.REGION)
      │  JSON Patch response
      ▼
Commerce applies totals patch

Admin UI / EDS storefront
      │
      │  REST calls (Adobe auth)
      ▼
rules-create / rules-get / rules-list / rules-delete ──── I/O State
```

Rules are stored in Adobe I/O State under the key pattern `rule.{COUNTRY}.{REGION}` with a 1-year TTL (31,536,000 seconds).

## Rule Schema

A fee rule has the following shape:

```json
{
  "country": "US",
  "region": "CA",
  "name": "California Flat Fee",
  "type": "fixed",
  "value": 9.99
}
```

| Field     | Type                        | Description                                               |
| --------- | --------------------------- | --------------------------------------------------------- |
| `country` | string                      | ISO country code (stored and matched uppercase)           |
| `region`  | string                      | Region / state code (stored and matched uppercase)        |
| `name`    | string                      | Display name shown as the total segment title in cart     |
| `type`    | `"fixed"` \| `"percentage"` | Fee calculation method                                    |
| `value`   | number                      | Fixed amount in store currency, or percentage of subtotal |

### Fee Types

- **`fixed`** — A flat amount added to the cart regardless of subtotal. `value: 9.99` always adds $9.99.
- **`percentage`** — A percentage of the cart subtotal, rounded to 2 decimal places. `value: 5` on a $100 subtotal adds $5.00.

Percentage values are capped at 100 on create. Both types require `value > 0`.

## API Reference

All rules endpoints require an Adobe IMS bearer token (`require-adobe-auth: true`).

---

### POST `delivery-fee/rules-create`

Creates or overwrites a fee rule for a country/region combination. If a rule already exists for the key it is replaced.

**Request body** (JSON):

```json
{
  "country": "US",
  "region": "CA",
  "name": "California Flat Fee",
  "type": "fixed",
  "value": 9.99
}
```

**Success response** `200`:

```json
{
  "success": true,
  "rule": {
    "country": "US",
    "region": "CA",
    "name": "California Flat Fee",
    "type": "fixed",
    "value": 9.99
  }
}
```

**Validation errors** `400`:

| Condition                          | Message                                |
| ---------------------------------- | -------------------------------------- |
| Missing `country`                  | `country is required`                  |
| Missing `region`                   | `region is required`                   |
| Missing `name`                     | `name is required`                     |
| `type` not `fixed` or `percentage` | `type must be fixed or percentage`     |
| Missing or non-positive `value`    | `value must be a positive number`      |
| Percentage `value` > 100           | `percentage value must not exceed 100` |

---

### GET `delivery-fee/rules-get?country={}&region={}`

Retrieves a single rule.

**Query parameters:** `country`, `region` (required)

**Success response** `200`:

```json
{
  "rule": {
    "country": "US",
    "region": "CA",
    "name": "California Flat Fee",
    "type": "fixed",
    "value": 9.99
  }
}
```

**Not found** `404`:

```json
{
  "error": "Rule not found for US:CA"
}
```

---

### GET `delivery-fee/rules-list`

Returns all stored rules. No parameters required.

**Success response** `200`:

```json
{
  "rules": [
    {
      "country": "US",
      "region": "CA",
      "name": "California Flat Fee",
      "type": "fixed",
      "value": 9.99
    },
    {
      "country": "US",
      "region": "NY",
      "name": "NY Percentage Fee",
      "type": "percentage",
      "value": 5
    }
  ]
}
```

---

### DELETE `delivery-fee/rules-delete?country={}&region={}`

Deletes a rule. Does not error if the rule does not exist.

**Query parameters:** `country`, `region` (required)

**Success response** `200`:

```json
{ "success": true }
```

---

### GET `delivery-fee/calculate?country={}&region={}&subtotal={}&currency={}`

Public standalone endpoint. Calculates and returns the fee for a given address + subtotal without modifying any cart state.

**Query parameters:**

| Param      | Required | Description                    |
| ---------- | -------- | ------------------------------ |
| `country`  | Yes      | Country code                   |
| `region`   | Yes      | Region / state code            |
| `subtotal` | Yes      | Positive numeric cart subtotal |
| `currency` | Yes      | Currency code (e.g. `USD`)     |

**Success response** `200`:

```json
{
  "fee": 9.99,
  "name": "California Flat Fee",
  "currency": "USD"
}
```

When no rule is found for the country/region, `fee` is `0` and `name` is `"No delivery fee applies"`.

**Validation errors** `400`: missing or invalid `country`, `region`, `subtotal` (must be positive), or `currency`.

---

## Webhook: `webhook-quote-total`

Triggered by the Commerce `cart_total_repository.get` synchronous webhook. Injects or updates the `delivery_fee` total segment and adjusts `grand_total` via JSON Patch operations.

### Configuration

```yaml
webhook-quote-total:
  web: "yes"
  annotations:
    require-adobe-auth: false
    final: false
```

`final: false` is required for Commerce synchronous webhooks. This action does **not** use `raw-http: true` — the body is delivered as parsed parameters (unlike the tax actions).

### Webhook Payload

Commerce passes the full quote object. The action reads:

- `params.quote.shipping_address.country_id`
- `params.quote.shipping_address.region_code`
- `params.quote.subtotal`
- `params.quote.base_currency_code`
- `params.totals.total_segments`
- `params.totals.grand_total`

If `shipping_address` or `country_id` is missing (e.g. cart has no shipping address yet), the validator sets `skip: true` and the action returns `200` with an empty patch array `[]` — no error, no totals change.

### Response Format

Returns a JSON Patch operations array. Commerce applies these to the totals object.

**Example — rule found, fee = $9.99:**

```json
[
  {
    "op": "add",
    "path": "/totals/total_segments/-",
    "value": {
      "code": "delivery_fee",
      "title": "California Flat Fee",
      "value": 9.99
    }
  },
  { "op": "replace", "path": "/totals/grand_total", "value": 109.99 }
]
```

**Example — no rule found (fee = 0):**

```json
[]
```

**Idempotency:** If a `delivery_fee` segment already exists in `total_segments` (from a prior calculation), the action removes it first (in descending index order to preserve array validity), then adds the new one and recalculates `grand_total`. This ensures correct totals across repeated cart recalculations.

## State Service (`lib/state-service.js`)

All actions share a single state library wrapper at `actions/delivery-fee/lib/state-service.js`.

| Function                      | Description                                   |
| ----------------------------- | --------------------------------------------- |
| `getRule(country, region)`    | Returns rule object or `null`                 |
| `putRule(rule)`               | Upserts rule with 1-year TTL                  |
| `deleteRule(country, region)` | Removes rule (no-op if absent)                |
| `listRules()`                 | Scans for all `rule.*` keys and returns array |

**State key format:** `rule.{COUNTRY}.{REGION}` (uppercase, e.g. `rule.US.CA`)

**TTL:** 31,536,000 seconds (1 year). Rules do not auto-expire in practice but are refreshed on each write.

**Listing:** Uses `state.list({ match: "rule.*" })` with an async iterator over key batches. Each key is fetched individually — suitable for small rule sets.

## Handler Pipeline

All actions follow the standard 6-file handler structure:

```
actions/delivery-fee/{action}/
├── index.js        — Orchestrates pipeline; returns HTTP response
├── validator.js    — Validates input params; returns { success, message }
├── pre.js          — Normalizes params (uppercase country/region, parse numbers)
├── transformer.js  — Computes fee or transforms rule data
├── sender.js       — Reads/writes I/O State via state-service
└── post.js         — Assembles final response shape
```

### Error Handling (all actions)

| Condition                       | Status | Body                                                   |
| ------------------------------- | ------ | ------------------------------------------------------ |
| Validation failure              | 400    | `{ "error": "<message>" }`                             |
| Rule not found (rules-get only) | 404    | `{ "error": "Rule not found for {country}:{region}" }` |
| No shipping address (webhook)   | 200    | `[]` (empty patch — skip gracefully)                   |
| Unhandled exception             | 500    | `{ "error": "Internal server error" }`                 |

## File Structure

```
actions/delivery-fee/
├── actions.config.yaml
├── lib/
│   └── state-service.js        — Shared I/O State wrapper
├── calculate/                  — Public fee calculation endpoint
│   ├── index.js
│   ├── validator.js
│   ├── pre.js
│   ├── transformer.js          — Applies fixed or percentage fee formula
│   ├── sender.js               — getRule from state
│   └── post.js
├── rules-create/               — Create/overwrite a rule
├── rules-get/                  — Fetch one rule by country + region
├── rules-list/                 — List all rules
├── rules-delete/               — Delete a rule by country + region
└── webhook-quote-total/        — Commerce webhook: inject fee into totals
    ├── index.js
    ├── validator.js            — Skip gracefully if no shipping address
    ├── pre.js
    ├── transformer.js          — fixed / percentage fee calculation
    ├── sender.js               — getRule from state
    └── post.js                 — Idempotent JSON Patch with grand_total update
```

## Testing

Tests are located at `test/actions/delivery-fee/`.

```bash
npm test -- --testPathPattern="delivery-fee"
```

The test suite covers:

- Action config assertions (web, auth annotations)
- Validation for all required params and type/value constraints
- `fixed` and `percentage` fee calculation
- Zero fee when no rule is found
- 2 decimal place rounding for percentage fees
- State service: get, put, delete, list operations
- Webhook: skip on missing shipping address, idempotent grand_total patch
- 500 on unexpected errors

## Deployment

No additional environment variables are required beyond the standard Adobe I/O Runtime credentials. Adobe I/O State is provisioned automatically for the workspace.

After deploying, register the `webhook-quote-total` action URL in Commerce Admin under **System → Webhooks** bound to the `cart_total_repository.get` event.

```bash
aio app deploy
```
