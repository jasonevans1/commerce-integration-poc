# Task 002: Implement collect-taxes Webhook Action (TDD: tests + implementation)

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Implement the `collect-taxes` synchronous webhook action under `actions/tax/collect-taxes/` following the 6-file handler pattern, plus its full unit test suite. This is a TDD task: write tests and implementation together so the response contract is consistent between them.

This action is called by Commerce whenever a cart/quote is recalculated. It applies a configurable flat-rate tax percentage (from `TAX_RATE_PERCENT` env var) to taxable line items and returns the tax amounts in the format expected by Commerce's out-of-process tax management module. It also verifies the incoming webhook signature using `COMMERCE_WEBHOOKS_PUBLIC_KEY`.

## Context

- **Source**: Fetch the actual implementation from the checkout starter kit repo and adapt it:
  - Try fetching the raw files from `https://github.com/adobe/commerce-checkout-starter-kit/tree/main/actions/tax/collect-taxes/`
  - Look for all 6 handler files in that directory on GitHub
  - Use these as the base — adapt for flat-rate logic and this project's conventions
  - If the upstream repo cannot be fetched, invoke the `search-commerce-docs` MCP tool to find the official `oop_tax_collection.collect_taxes` request/response schema
- **Reference handler**: `actions/delivery-fee/webhook-quote-total/` — exact same 6-file pattern to follow for structure, error handling, and response format
- **Reference test**: `test/actions/delivery-fee/webhook-quote-total/webhook-quote-total.test.js` — follow this structure exactly for the test file
- **Test file location**: `test/actions/tax/collect-taxes/collect-taxes.test.js`
- **Handler files to create** (all under `actions/tax/collect-taxes/`):
  - `index.js` — orchestrates the 6-step pipeline, exports `main`
  - `validator.js` — validates incoming webhook payload AND verifies the Commerce webhook signature (`x-adobe-commerce-webhook-signature` header) using `COMMERCE_WEBHOOKS_PUBLIC_KEY`. If the env var is absent/empty, skip verification (local dev). Exports `validateData`.
  - `pre.js` — normalizes/extracts fields from raw payload, exports `preProcess`
  - `transformer.js` — applies flat-rate calculation to produce tax line items, exports `transformData`. MUST coerce `TAX_RATE_PERCENT` from string to number (env vars come in as strings) and round computed tax to 2 decimal places (half-up).
  - `sender.js` — for tax webhooks this is a no-op (no external call needed for flat rate), exports `sendData`
  - `post.js` — builds the final Commerce webhook response, exports `postProcess`
- **`actions/tax/actions.config.yaml`** — CREATE this file with ONLY the `collect-taxes` entry. Task 003 will APPEND `collect-adjustment-taxes` (do not overwrite). Use `final: false` (matches the `webhook-quote-total` reference and the starter-kit upstream for synchronous webhooks). Include `inputs: TAX_RATE_PERCENT: $TAX_RATE_PERCENT` and `inputs: COMMERCE_WEBHOOKS_PUBLIC_KEY: $COMMERCE_WEBHOOKS_PUBLIC_KEY` so the env vars are available to the handler.
  ```yaml
  collect-taxes:
    function: collect-taxes/index.js
    web: "yes"
    runtime: nodejs:22
    inputs:
      LOG_LEVEL: debug
      TAX_RATE_PERCENT: $TAX_RATE_PERCENT
      COMMERCE_WEBHOOKS_PUBLIC_KEY: $COMMERCE_WEBHOOKS_PUBLIC_KEY
    annotations:
      require-adobe-auth: false
      final: false
  ```
- **Webhook payload (request)**: Commerce sends the quote/cart data via a POST. The exact field names — fetch from starter kit source. Common fields: cart_id / quote / items (with `unit_price`, `quantity`, `row_total`, `tax_class_id`), shipping_address (`country_id`, `region_code`, `postcode`).
- **Response Contract (CRITICAL)**: The OOP tax module expects an `oopQuote` response. The exact shape MUST be fetched from the starter kit source — do NOT guess. Common shape (verify against source):
  ```json
  {
    "taxes": [
      {
        "code": "flat-rate-tax",
        "amount": 8.5,
        "type": "tax",
        "title": "Flat Rate Tax",
        "rate": 8.5,
        "applied_to": "<item_code>"
      }
    ]
  }
  ```
  If the upstream sample shows a different shape (e.g., wrapped in `{ oopQuote: {...} }` or returning JSON Patch ops), use that exact shape. Document the chosen shape in Implementation Notes when complete.
- **Flat rate config**: Read `TAX_RATE_PERCENT` from `params` (injected from `app.config.yaml` inputs). Default to `0` if not set. Apply as a percentage to the sum of taxable line item `row_total` values. Coerce to `Number()` first (env vars are strings).
- **Auth**: `require-adobe-auth: false` — Commerce calls this endpoint directly, no IMS auth on inbound requests. Webhook signature verification (in `validator.js`) replaces auth.
- **Signature verification**: Use Node's `crypto.verify` with the public key in PEM format. The signature header is base64-encoded. If `COMMERCE_WEBHOOKS_PUBLIC_KEY` is not set in `params`, skip verification (returns success) and log a warning — this preserves local-dev ergonomics. If the key IS set and verification fails, return 401.
- **`final: false`**: Required so the OOP tax module can invoke this as a public web action. Do NOT use `final: true` (breaks invocation in some app-registry validators per project memory).

## Requirements (Test Descriptions)

### Scaffold tests

- [ ] `it creates actions/tax/actions.config.yaml with collect-taxes entry with web yes, require-adobe-auth false, and final false`
- [ ] `it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-taxes config entry`
- [ ] `it creates all six handler files in actions/tax/collect-taxes/`
- [ ] `it exports main from index.js`
- [ ] `it exports validateData from validator.js`
- [ ] `it exports preProcess from pre.js`
- [ ] `it exports transformData from transformer.js`
- [ ] `it exports sendData from sender.js`
- [ ] `it exports postProcess from post.js`

### Behavior tests

- [ ] `it returns 400 when required webhook payload fields are missing`
- [ ] `it returns 200 with tax amounts when valid quote payload is provided`
- [ ] `it calculates tax as TAX_RATE_PERCENT percent of taxable line item row_total values`
- [ ] `it coerces TAX_RATE_PERCENT from string to number before calculation`
- [ ] `it rounds computed tax to 2 decimal places`
- [ ] `it returns 200 with zero tax when TAX_RATE_PERCENT is 0`
- [ ] `it returns 200 with zero tax when TAX_RATE_PERCENT is unset`
- [ ] `it returns 500 on unexpected internal errors`
- [ ] `it sender returns the expected no-op shape`
- [ ] `it preProcess extracts the expected fields from the raw payload`

### Signature verification tests

- [ ] `it skips signature verification when COMMERCE_WEBHOOKS_PUBLIC_KEY is not set`
- [ ] `it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature header is missing or invalid`
- [ ] `it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid`

## Acceptance Criteria

- All requirements have passing tests
- All 6 handler files present and wired together correctly in `index.js`
- `actions/tax/actions.config.yaml` created with `collect-taxes` action entry only (task 003 adds `collect-adjustment-taxes`)
- Flat rate calculation uses `TAX_RATE_PERCENT` from action inputs, coerced to Number, rounded to 2 decimals
- Signature verification implemented in `validator.js` with skip-if-key-absent fallback
- `final: false` (NOT `final: true`) on the action annotations
- Named constants used for all numeric literals in tests (e.g., `TAX_RATE = 10`, `SUBTOTAL = 100`, `EXPECTED_TAX = 10`) — never inline magic numbers
- Mocking: only mock external I/O (network calls, file system if needed). Do not mock the action's own internal functions — test them through `main`.
- Code passes Biome lint

## Implementation Notes

(Left blank — filled in by programmer during implementation. MUST document the final response contract shape used.)
