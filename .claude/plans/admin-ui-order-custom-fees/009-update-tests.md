# Task 009: Update Registration Action Tests (Backend)

**Status**: complete
**Depends on**: 001
**Retry count**: 0

## Description

Update the registration action test to reflect the new `order.customFees` format. The test runs in the backend Jest project (Node environment). Mock `state-service.listRules()` and assert the new response shape.

## Context

- File to UPDATE: `test/actions/commerce-backend-ui-1/registration.test.js`
- Mock needed: `jest.mock('../../../actions/delivery-fee/lib/state-service')` (3 levels up from `test/actions/commerce-backend-ui-1/` to project root, then into `actions/`)
- The action is now `async` and the existing test already uses `await main(...)`, so that pattern continues to work
- Rule objects have shape `{ country, region, name, type, value }` -- the test mock must match this shape
- Sample mock data: `[{ country: 'US', region: 'CA', name: 'California Delivery', type: 'fixed', value: 5.99 }]`

### Registration action test updates

- Mock `stateService.listRules` to return sample rules
- Assert response shape is `body.registration.order.customFees[]`
- Assert each fee has `id`, `label`, `value`
- Assert fee id is `delivery-fee-us-ca` (lowercase)
- Assert fee label is `Delivery Fee -- US/CA`
- Test empty state returns `customFees: []`
- Test error case returns `customFees: []`
- Remove all assertions referencing `pages[]`

## Requirements (Test Descriptions)

- [x] `registration action returns registration.order.customFees array`
- [x] `registration action maps listRules result to customFees with correct id label value`
- [x] `registration action returns empty customFees when listRules returns empty array`
- [x] `registration action returns empty customFees when listRules throws`

## Acceptance Criteria

- All requirements have passing tests
- No references to `pages` in test assertions
- `npm run code:lint:fix && npm run code:format:fix` produces no errors
