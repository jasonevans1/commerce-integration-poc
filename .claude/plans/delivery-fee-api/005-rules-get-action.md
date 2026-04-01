# Task 005: Get Rule Action (6 Files)

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Implement the `rules-get` runtime action using all 6 handler files. This internal action retrieves a single delivery fee rule by country and region from I/O State.

## Context

- Related files: `actions/delivery-fee/rules-get/` (new directory with 6 files)
- Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/` for file structure only. **NOTE:** The orchestration order deliberately differs from the starter kit pattern. See task 003 for details. Do NOT use `actionSuccessResponse`/`actionErrorResponse` from `actions/responses.js` -- construct response objects directly as `{ statusCode, body: { ... } }`.
- Request: HTTP GET with query params `?country=US&region=CA`
- Response found: `{ rule: { country, region, name, type, value } }`
- Response not found: 404 with `{ error: "Rule not found for US:CA" }`
- Uses `state-service.getRule(country, region)` from Task 002
- Action requires Adobe auth (`require-adobe-auth: true`)

### File responsibilities:

- `index.js` — entry point: orchestrates validator -> pre -> sender -> transformer -> post, returns HTTP response. Must wrap pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures.
- `validator.js` — validates `country` and `region` query params are present
- `pre.js` — normalizes: uppercase country and region
- `sender.js` — calls `state-service.getRule(country, region)`, returns rule or null
- `transformer.js` — pass-through
- `post.js` — returns 200 with rule if found, 404 if null

## Requirements (Test Descriptions)

- [x] `it returns 400 when country query param is missing`
- [x] `it returns 400 when region query param is missing`
- [x] `it uppercases country and region before lookup`
- [x] `it returns 200 with rule object when rule exists`
- [x] `it returns 404 with error message when rule does not exist`
- [x] `it returns 500 with error message when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist in `actions/delivery-fee/rules-get/`
- Action is registered in `actions/delivery-fee/actions.config.yaml` as `rules-get`

## Implementation Notes

- Implemented all 6 files in `actions/delivery-fee/rules-get/` using validator -> pre -> sender -> transformer -> post orchestration order.
- `pre.js` captures `originalCountry` and `originalRegion` before normalization; `index.js` passes them through to `postProcess` for use in 404 error message.
- `transformer.js` is a pass-through as specified.
- `sender.js` delegates to `stateService.getRule(country, region)` with `await`.
- All 6 tests pass; full suite passes (440 tests, 89 suites).
