# Task 003: React Test Setup & API Utility

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Install React testing dependencies and configure a jsdom jest project for frontend tests, then create `src/commerce-backend-ui-1/web-src/src/utils/api.js` — the authenticated fetch wrapper that all SPA components use to call the Phase 1 rule actions using the IMS token read from `@adobe/uix-guest` `sharedContext`.

## Context

- The existing `test/jest.config.js` uses `testEnvironment: "node"` and covers `actions/**/*.js`. React component tests need `testEnvironment: "jsdom"` and must not break existing backend tests.
- Recommended approach: convert `test/jest.config.js` to use a `projects` array with two project configs:
  1. **backend** project: keeps the existing `node` environment, `collectCoverageFrom` targeting `actions/`, `onboarding/`, `utils/`, and test roots in `test/` (excluding `test/web-src/`).
  2. **frontend** project: uses `jsdom` environment, `collectCoverageFrom` targeting `src/commerce-backend-ui-1/web-src/src/**/*.{js,jsx}`, and test roots in `test/web-src/`.
- **IMPORTANT: test file location.** The `npm test` script in `package.json` runs `jest --passWithNoTests -c ./test/jest.config.js ./test`. This restricts test discovery to the `./test` directory. Frontend test files MUST be placed under `test/web-src/` (e.g., `test/web-src/utils/api.test.js`, `test/web-src/components/RuleList.test.jsx`). Alternatively, update the `npm test` script to remove the `./test` path restriction if using jest projects. Choose one approach and document it clearly.
- New devDependencies to add to the ROOT `package.json` (not `web-src/package.json`): `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`. Jest runs from the project root, so these must be available there.
- **Frontend coverage thresholds:** The frontend jest project should start with no coverage thresholds (or lenient ones) since we are building new code incrementally. The existing backend thresholds (80% lines, 65% branches) must remain unchanged for the backend project.
- `api.js` exports functions: `listRules(imsToken)`, `createRule(imsToken, rule)`, `getRule(imsToken, country, region)`, `deleteRule(imsToken, country, region)`.
- **Action URL env var naming:** App Builder injects action URLs based on the package name and action name from `app.config.yaml`. For the `delivery-fee` package, the expected env var names are likely: `REACT_APP_ACTION_DELIVERY_FEE_RULES_LIST`, `REACT_APP_ACTION_DELIVERY_FEE_RULES_CREATE`, `REACT_APP_ACTION_DELIVERY_FEE_RULES_GET`, `REACT_APP_ACTION_DELIVERY_FEE_RULES_DELETE`. The worker MUST verify the exact naming convention by checking App Builder docs or running `aio app build` locally and inspecting the injected env vars. Do NOT guess -- the names must match exactly or all API calls will fail.
- **IMS token access pattern for child components:** Define a shared convention for how components access the IMS token. Recommended approach: each component that needs the token calls `@adobe/uix-guest`'s `useSharedContext()` hook (or equivalent) directly, rather than prop-drilling from `ExtensionRegistration`. Document this pattern in this task so Tasks 004, 006, and 007 workers all use the same approach. If `useSharedContext()` is not available, create a simple React context in `utils/guestConnection.js` that `ExtensionRegistration` populates and child components consume.
- Related files:
  - `test/jest.config.js` — existing config to convert to projects
  - `test/jest.setup.js` — existing setup file to reference
  - `package.json` — root; add devDependencies here, note the `npm test` script path

## Requirements (Test Descriptions)

- [ ] `it sends GET request to rules-list action URL with Authorization header`
- [ ] `it returns parsed JSON array of rules from listRules`
- [ ] `it sends POST request to rules-create action URL with rule body and Authorization header`
- [ ] `it returns created rule object from createRule`
- [ ] `it sends GET request to rules-get action URL with country and region query params`
- [ ] `it returns rule object from getRule`
- [ ] `it sends DELETE request to rules-delete action URL with country and region query params`
- [ ] `it resolves without value from deleteRule on success`
- [ ] `it throws an error when the action responds with a non-2xx status`

## Acceptance Criteria

- All requirements have passing tests
- React test environment is isolated from the node backend tests
- `npm test` continues to run both test suites
- No decrease in existing backend test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
