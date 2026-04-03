# Task 007: List Rules Action (6 Files)

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Implement the `rules-list` runtime action using all 6 handler files. This internal action retrieves all delivery fee rules from I/O State and returns them as an array.

## Context

- Related files: `actions/delivery-fee/rules-list/` (new directory with 6 files)
- Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/` for file structure only. **NOTE:** The orchestration order deliberately differs from the starter kit pattern. See task 003 for details. Do NOT use `actionSuccessResponse`/`actionErrorResponse` from `actions/responses.js` -- construct response objects directly as `{ statusCode, body: { ... } }`.
- Request: HTTP GET with no params
- Response: `{ rules: [ { country, region, name, type, value }, ... ] }`
- Empty state: `{ rules: [] }`
- Uses `state-service.listRules()` from Task 002
- Action requires Adobe auth (`require-adobe-auth: true`)
- Note: I/O State `list()` returns an async generator yielding `{ keys: string[] }` batches (keys only, not values). The `state-service.listRules()` method handles fetching values for each key internally.

### File responsibilities:

- `index.js` — entry point: orchestrates validator -> pre -> sender -> transformer -> post, returns HTTP response. Must wrap pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures.
- `validator.js` — no input validation needed (no params); pass-through
- `pre.js` — pass-through
- `sender.js` — calls `state-service.listRules()` which handles the list+get complexity internally; returns the array of rule objects
- `transformer.js` — pass-through
- `post.js` — returns 200 with `{ rules: [...] }`

## Requirements (Test Descriptions)

- [x] `it returns 200 with empty rules array when no rules exist`
- [x] `it returns 200 with all rules as an array`
- [x] `it returns each rule with country, region, name, type, and value fields`
- [x] `it returns 500 with error message when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist in `actions/delivery-fee/rules-list/`
- Action is registered in `actions/delivery-fee/actions.config.yaml` as `rules-list`

## Implementation Notes

All 6 files created in `actions/delivery-fee/rules-list/`:

- `index.js` — orchestrates validator -> pre -> sender -> transformer -> post with try-catch returning 500 on failure
- `validator.js` — pass-through returning `{ success: true }`
- `pre.js` — pass-through returning params
- `sender.js` — calls `stateService.listRules()` and returns the array
- `transformer.js` — pass-through returning rules array unchanged
- `post.js` — returns `{ statusCode: 200, body: { rules } }`

Test file: `test/actions/delivery-fee/rules-list/rules-list.test.js`
All 4 tests pass. Full test suite: 440 tests across 89 suites all passing.
