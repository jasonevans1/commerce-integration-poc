# Task 006: Delete Rule Action (6 Files)

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Implement the `rules-delete` runtime action using all 6 handler files. This internal action removes a delivery fee rule from I/O State by country and region.

## Context

- Related files: `actions/delivery-fee/rules-delete/` (new directory with 6 files)
- Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/` for file structure only. **NOTE:** The orchestration order deliberately differs from the starter kit pattern. See task 003 for details. Do NOT use `actionSuccessResponse`/`actionErrorResponse` from `actions/responses.js` -- construct response objects directly as `{ statusCode, body: { ... } }`.
- Request: HTTP DELETE with query params `?country=US&region=CA`
- Response: `{ success: true }` regardless of whether the rule existed (idempotent delete)
- Uses `state-service.deleteRule(country, region)` from Task 002
- Action requires Adobe auth (`require-adobe-auth: true`)

### File responsibilities:

- `index.js` — entry point: orchestrates validator -> pre -> sender -> transformer -> post, returns HTTP response. Must wrap pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures.
- `validator.js` — validates `country` and `region` query params are present
- `pre.js` — normalizes: uppercase country and region
- `sender.js` — calls `state-service.deleteRule(country, region)`
- `transformer.js` — pass-through
- `post.js` — returns 200 with `{ success: true }`

## Requirements (Test Descriptions)

- [x] `it returns 400 when country query param is missing`
- [x] `it returns 400 when region query param is missing`
- [x] `it uppercases country and region before deleting`
- [x] `it returns 200 with success true when rule exists`
- [x] `it returns 200 with success true when rule does not exist (idempotent)`
- [x] `it returns 500 with error message when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist in `actions/delivery-fee/rules-delete/`
- Action is registered in `actions/delivery-fee/actions.config.yaml` as `rules-delete`

## Implementation Notes

All 6 files created in `actions/delivery-fee/rules-delete/`. Pipeline order: validator -> pre -> sender -> transformer -> post. Pre-process uppercases country and region. Delete is idempotent (always returns 200 on success). Catch block uses `_error` to satisfy Biome lint rule for unused variables.
