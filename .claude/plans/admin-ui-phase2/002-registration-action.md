# Task 002: Registration Action

**Status**: completed
**Depends on**: 001
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/actions/registration/index.js` — the IMS-authenticated App Builder action that the Admin UI SDK calls to discover the menu registrations this app provides. It must return a JSON body with the "Delivery Fees" menu entry nested under "Stores".

## Context

- The Admin UI SDK (3.0+) requires `require-adobe-auth: true` on the registration action. The App Builder runtime itself enforces auth — unauthenticated requests are rejected BEFORE the action code runs. The action code does NOT need to validate the Authorization header; that is the runtime's responsibility.
- The action follows the same orchestrator pattern as other actions in `actions/delivery-fee/` (index.js calls pre -> sender -> transformer -> post).
- However, registration is simple enough that a single index.js without the full 6-file split is acceptable — check existing similar examples in the repo first.
- Related files:
  - `actions/delivery-fee/rules-list/index.js` — reference for the handler pattern
  - `test/actions/delivery-fee/rules-list/` — reference for test structure
- Test file location: `test/actions/commerce-backend-ui-1/registration.test.js`

## Requirements (Test Descriptions)

- [ ] `it returns 200 with menu registration JSON when called with a valid IMS bearer token`
- [ ] `it returns the menu id delivery-fee-rules in the response`
- [ ] `it returns the menu label Delivery Fees in the response`
- [ ] `it returns the menu parent Stores in the response`
- [ ] `it returns the menu icon Airplane in the response`

## Acceptance Criteria

- All requirements have passing tests
- Action is referenced correctly in `ext.config.yaml` (Task 001)
- `require-adobe-auth: true` in `ext.config.yaml`
- No decrease in test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
