# Task 001: Register Stores > Settings Page in Admin UI SDK

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Update the Admin UI SDK registration action to declare a new page under the Stores > Settings section of Commerce Admin. The registration action is the backend that tells the Admin UI SDK which extension points this app contributes.

## Context

- **Registration action**: `src/commerce-backend-ui-1/actions/registration/index.js`
- **Existing payload shape**: `{ registration: { order: { customFees, massActions } } }`
- **Target**: Add a `page` (or equivalent) key to the registration payload for a Stores > Settings entry pointing to `index.html#/custom-fees-config`
- **Doc lookup required**: Before writing any code, use the `search-commerce-docs` MCP tool to find the exact Admin UI SDK v3 registration schema for adding a page to Stores > Settings. Search for "Admin UI SDK page extension point stores settings registration".
- **Existing test**: `test/actions/commerce-backend-ui-1/registration.test.js` — add new tests here; do not break existing ones.
- **Page path**: `index.html#/custom-fees-config` (HashRouter route added in task 006)

## Requirements (Test Descriptions)

- [x] `it includes a page registration entry in the response body`
- [x] `it sets the page title to "Custom Fees"`
- [x] `it sets the page href to "index.html#/custom-fees-config"`
- [x] `it still returns order.customFees and order.massActions alongside the page registration`

## Acceptance Criteria

- All requirements have passing tests
- Existing registration tests continue to pass
- Code follows biome.jsonc standards (run `npm run code:lint:fix && npm run code:format:fix` after changes)

## Implementation Notes

- Added a `page` key to `registration.body.registration` in `src/commerce-backend-ui-1/actions/registration/index.js` with `title: "Custom Fees"` and `href: "index.html#/custom-fees-config"`.
- TDD approach: wrote each test first (RED), then added the minimal implementation (GREEN).
- Requirement 4 test passed immediately after requirements 1-3 were implemented — the combined structure was already in place.
- All 4 new tests added to `test/actions/commerce-backend-ui-1/registration.test.js` alongside the 11 pre-existing tests (15 total, all passing).
- Biome lint clean on both modified files.
