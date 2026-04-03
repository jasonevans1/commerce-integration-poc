# Task 004: Create/Update Rule Action (6 Files)

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Implement the `rules-create` runtime action (upsert) using all 6 handler files. This internal action creates or updates a delivery fee rule in I/O State. It is auth-protected and intended for admin use.

## Context

- Related files: `actions/delivery-fee/rules-create/` (new directory with 6 files)
- Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/` for file structure only. **NOTE:** The orchestration order deliberately differs from the starter kit pattern. See task 003 for details. Do NOT use `actionSuccessResponse`/`actionErrorResponse` from `actions/responses.js` -- construct response objects directly as `{ statusCode, body: { ... } }`.
- Request: HTTP POST with JSON body `{ country, region, name, type, value }`
- `type` must be `"fixed"` or `"percentage"`
- `value` must be a positive number; for percentage type, valid range is 0–100
- Response: `{ success: true, rule: { country, region, name, type, value } }`
- Uses `state-service.putRule(rule)` from Task 002
- Action requires Adobe auth (`require-adobe-auth: true`)

### File responsibilities:

- `index.js` — entry point: orchestrates validator -> pre -> sender -> transformer -> post, returns HTTP response. Must wrap pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures.
- `validator.js` — validates all required fields, type enum, value range
- `pre.js` — normalizes: uppercase country/region, parse value as float, trim strings
- `sender.js` — calls `state-service.putRule(rule)`, returns the stored rule
- `transformer.js` — pass-through (no transformation needed)
- `post.js` — formats success response

## Requirements (Test Descriptions)

- [x] `it returns 400 when country is missing`
- [x] `it returns 400 when region is missing`
- [x] `it returns 400 when name is missing`
- [x] `it returns 400 when type is not fixed or percentage`
- [x] `it returns 400 when value is missing`
- [x] `it returns 400 when value is not a positive number`
- [x] `it returns 400 when type is percentage and value exceeds 100`
- [x] `it uppercases country and region before storing`
- [x] `it stores rule in state and returns 200 with rule object`
- [x] `it overwrites existing rule when same country and region provided`
- [x] `it returns 500 with error message when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist in `actions/delivery-fee/rules-create/`
- Action is registered in `actions/delivery-fee/actions.config.yaml` as `rules-create`

## Implementation Notes

All 6 handler files created in `actions/delivery-fee/rules-create/`:

- `validator.js` — validates required fields (country, region, name), type enum (fixed/percentage), value positive number, percentage max 100
- `pre.js` — uppercases country/region, trims name, parses value as float
- `sender.js` — calls `stateService.putRule(rule)` and returns the stored rule
- `transformer.js` — pass-through returning rule as-is
- `post.js` — formats `{ statusCode: 200, body: { success: true, rule } }` response
- `index.js` — orchestrates validator -> pre -> sender -> transformer -> post, returns 400 on validation error and 500 on unexpected exception

Test file: `test/actions/delivery-fee/rules-create/rules-create.test.js`
All 11 tests pass. Full test suite: 440 tests passing.
