# Task 003: Calculate Fee Action (6 Files)

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Implement the public `calculate` runtime action using all 6 handler files. This action accepts a shipping address and quote subtotal, looks up a matching fee rule from state, computes the fee, and returns the result.

## Context

- Related files: `actions/delivery-fee/calculate/` (new directory with 6 files)
- Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/` for file structure only. **NOTE:** The orchestration order in `index.js` deliberately differs from the starter kit pattern. The starter kit uses validator -> transformer -> pre -> sender -> post. This action uses validator -> pre -> sender -> transformer -> post (pre normalizes input, sender fetches state, transformer computes fee). Do NOT copy the starter kit `index.js` flow verbatim.
- Request: HTTP POST with JSON body `{ country, region, subtotal, currency }`
- Response success: `{ fee: number, name: string, currency: string }`
- Response no-match: `{ fee: 0, name: "No delivery fee applies", currency: string }`
- Fee calculation: if `type === "fixed"` → `fee = rule.value`; if `type === "percentage"` → `fee = round(subtotal * rule.value / 100, 2)`
- Uses `state-service.getRule(country, region)` from Task 002
- Action is public (`require-adobe-auth: false`)

### File responsibilities:

- `index.js` — entry point: orchestrates validator -> pre -> sender -> transformer -> post, returns HTTP response. Must wrap pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures. Do NOT use `actionSuccessResponse`/`actionErrorResponse` from `actions/responses.js` -- the response shape for this API differs from the starter kit convention. Construct response objects directly as `{ statusCode, body: { ... } }`.
- `validator.js` — validates presence and types of `country`, `region`, `subtotal`, `currency`
- `pre.js` — normalizes inputs: uppercase `country` and `region`, parse `subtotal` as float
- `sender.js` — calls `state-service.getRule(country, region)`, returns rule or null
- `transformer.js` — computes fee amount from rule; returns zero-fee object if rule is null
- `post.js` — formats final response object `{ fee, name, currency }`

## Requirements (Test Descriptions)

- [x] `it returns 400 when country is missing`
- [x] `it returns 400 when region is missing`
- [x] `it returns 400 when subtotal is missing`
- [x] `it returns 400 when currency is missing`
- [x] `it returns 400 when subtotal is not a positive number`
- [x] `it uppercases country and region before lookup`
- [x] `it returns fixed fee amount when rule type is fixed`
- [x] `it returns percentage-based fee rounded to 2 decimal places when rule type is percentage`
- [x] `it returns fee of 0 and name "No delivery fee applies" when no rule matches`
- [x] `it returns 200 with fee, name, and currency on success`
- [x] `it returns 500 with error message when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist in `actions/delivery-fee/calculate/`
- Action is registered in `actions/delivery-fee/actions.config.yaml` as `calculate`

## Implementation Notes

Implemented all 6 handler files in `actions/delivery-fee/calculate/` with the orchestration order: validator -> pre -> sender -> transformer -> post. Response objects are constructed directly without using `actionSuccessResponse`/`actionErrorResponse`. The percentage fee calculation uses `Math.round((subtotal * value / 100) * 100) / 100` for 2 decimal place precision. All 11 tests pass, full suite 440/440.
