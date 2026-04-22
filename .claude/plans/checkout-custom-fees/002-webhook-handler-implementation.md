# Task 002: Webhook Handler 6-File Implementation

**Status**: completed
**Depends on**: 001
**Retry count**: 0

## Description

Implement the full 6-file handler for the `webhook-quote-total` action. This handler receives a Commerce synchronous webhook payload containing the quote's shipping address and current totals, looks up the matching delivery fee rule from I/O State, and returns JSON Patch operations to inject a custom total segment (and update grand total) into the Commerce response.

## Context

- Related files:
  - `actions/delivery-fee/webhook-quote-total/` — the 6 files to implement (created in task 001)
  - `actions/delivery-fee/lib/state-service.js` — reuse `getRule(country, region)` exactly as-is
  - `actions/delivery-fee/calculate/` — reference for fee computation logic (fixed vs percentage)
  - `scripts/onboarding/config/EVENTS_SCHEMA.json` — check if webhook payload schema is defined here; if not, use Commerce webhook docs schema

- Commerce webhook payload structure (after `cart_total_repository.get`):

  ```json
  {
    "quote": {
      "shipping_address": {
        "country_id": "US",
        "region_code": "CA",
        "region": "California"
      },
      "items_qty": 2,
      "subtotal": 149.0,
      "base_currency_code": "USD"
    },
    "totals": {
      "grand_total": 149.0,
      "subtotal": 149.0,
      "total_segments": [
        { "code": "subtotal", "title": "Subtotal", "value": 149.0 },
        { "code": "shipping", "title": "Shipping & Handling", "value": 0 },
        { "code": "tax", "title": "Tax", "value": 0 },
        { "code": "grand_total", "title": "Grand Total", "value": 149.0 }
      ]
    }
  }
  ```

- Expected response (JSON Patch array):

  ```json
  [
    {
      "op": "add",
      "path": "/totals/total_segments/-",
      "value": {
        "code": "delivery_fee",
        "title": "International Delivery Fee",
        "value": 14.9
      }
    },
    {
      "op": "replace",
      "path": "/totals/grand_total",
      "value": 163.9
    }
  ]
  ```

- When no fee rule matches: return `[]` (empty patch array — no changes)

- Fee computation (mirror of `calculate/transformer.js`):
  - `fixed` rule: `fee = rule.value`
  - `percentage` rule: `fee = Math.round((rule.value / 100) * subtotal * 100) / 100`

## Requirements (Test Descriptions)

- [ ] `it returns an empty patch array when no fee rule matches the shipping address`
- [ ] `it returns add and replace patch operations when a fixed fee rule matches`
- [ ] `it returns add and replace patch operations when a percentage fee rule matches`
- [ ] `it computes percentage fee correctly as a percentage of the quote subtotal`
- [ ] `it returns 400 when quote shipping address is missing from payload`
- [ ] `it returns 400 when country_id is missing from shipping address`
- [ ] `it returns 200 with empty patch array when region_code is absent (getRule with empty region returns no match)`
- [ ] `it uppercases country_id and region_code before rule lookup`
- [ ] `it returns 500 on state service failure without exposing internal error`
- [ ] `it sets the grand_total patch value to existing grand_total plus the fee`
- [ ] `it uses the rule name as the total segment title`
- [ ] `it uses delivery_fee as the total segment code`

## Acceptance Criteria

- All requirements have passing tests
- `sendData` in `sender.js` calls `stateService.getRule(country, region)` — no new I/O State code
- Fee computation logic is in `transformer.js`, matching the `calculate` action pattern
- `validator.js` validates the Commerce webhook payload shape (not individual address fields — just that `params.quote` and `params.quote.shipping_address` are present)
- `pre.js` normalises country/region to uppercase
- `post.js` assembles the JSON Patch array response
- Passes lint

## Implementation Notes

- Import `stateService` from `../lib/state-service.js` in `sender.js`
- The handler must return `{ statusCode: 200, body: [...patches] }` — Commerce expects HTTP 200 with the patch array
- On no-match, return `{ statusCode: 200, body: [] }` — empty array means no changes
- `required="false"` in the webhook registration means Commerce ignores non-2xx responses, but we should still log errors clearly
- Do NOT call the HTTP `calculate` action — call `stateService.getRule()` directly to avoid an extra HTTP round-trip
