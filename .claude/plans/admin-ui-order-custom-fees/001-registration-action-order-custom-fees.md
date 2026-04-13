# Task 001: Update Registration Action for order.customFees

**Status**: complete
**Depends on**: none
**Retry count**: 0

## Description

Replace the `pages` registration payload with the `order.customFees` extension point format. The action should dynamically read all delivery fee rules from I/O State using the existing `state-service.listRules()` and transform each rule into a custom fee object.

## Context

- File to modify: `src/commerce-backend-ui-1/actions/registration/index.js`
- Reference: `actions/delivery-fee/lib/state-service.js` — `listRules()` returns an array of `{ country, region, name, type, value }` objects
- Sample format from `adobe-commerce-samples`:
  ```js
  body: {
    registration: {
      order: {
        customFees: [
          {
            id: "test-fee-1",
            label: "Test Fee 1",
            value: 1.0,
            applyFeeOnLastCreditMemo: false,
          },
          {
            id: "test-fee-2",
            label: "Test Fee 2",
            value: 5.0,
            orderMinimumAmount: 20,
            applyFeeOnLastInvoice: true,
          },
        ];
      }
    }
  }
  ```
- Rule-to-fee mapping:
  - `id`: `"delivery-fee-{country}-{region}"` (lowercase)
  - `label`: `"Delivery Fee — {country}/{region}"`
  - `value`: `rule.value`
  - No `orderMinimumAmount` or `applyFee*` flags needed for initial implementation
- The action must be `async` to await the state service
- If state is empty or an error occurs, return `customFees: []` (do not throw)
- Path to state-service from registration action: `"../../../../actions/delivery-fee/lib/state-service"`

## Requirements (Test Descriptions)

- [x] `it returns 200 with registration.order.customFees array`
- [x] `it maps each rule to a customFee with id, label, and value`
- [x] `it constructs the fee id as delivery-fee-{country}-{region} in lowercase`
- [x] `it constructs the fee label as Delivery Fee — {country}/{region}`
- [x] `it sets fee value from rule.value`
- [x] `it returns empty customFees array when no rules exist in state`
- [x] `it returns empty customFees array when state service throws`

## Acceptance Criteria

- All requirements have passing tests
- Action is `async` and uses `stateService.listRules()`
- Never throws — returns `customFees: []` on empty state or error
- `pages` key no longer present in any response
