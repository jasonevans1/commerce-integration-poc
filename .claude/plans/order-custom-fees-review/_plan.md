---
name: order-custom-fees-review
description: Review and fix the order.customFees Admin UI extension against the official Admin UI SDK docs
type: project
---

# Plan: Order Custom Fees — Review & Fix

## Created

2026-04-10

## Status

completed

## Objective

Review the existing `order.customFees` Admin UI SDK implementation against the official docs and working hello-world pattern, and fix identified gaps: incorrect fee ID format, duplicate tests, and missing route coverage.

## Scope

### In Scope

- Update `customFees` fee `id` values to follow the `<extensionId>::<feeName>` format documented by the Admin UI SDK
- Remove duplicate test cases in `ExtensionRegistration.test.jsx` and `App.test.jsx`
- Add a test for the `/hello-world` route in `App.test.jsx` (added in the previous plan but never covered by tests)

### Out of Scope

- Changes to the `order.massActions` hello-world implementation
- Adding optional fee fields (`applyFeeOnLastInvoice`, `orderMinimumAmount`, etc.)
- Changes to the delivery-fee backend API actions
- Changes to `extension-manifest.json` or `ext.config.yaml`

## Success Criteria

- [ ] Fee `id` values use `delivery-fee-rules::us-ca` format instead of `delivery-fee-us-ca`
- [ ] No duplicate test cases in `ExtensionRegistration.test.jsx`
- [ ] No duplicate test cases in `App.test.jsx`
- [ ] `App.test.jsx` has a test for the `/hello-world` route
- [ ] All 508+ tests pass with no regressions
- [ ] Code passes `npm run code:lint:fix && npm run code:format:fix` with no errors

## Task Overview

| Task | Description                                             | Depends On | Status    |
| ---- | ------------------------------------------------------- | ---------- | --------- |
| 001  | Update customFees fee ID format to extensionId::feeName | -          | completed |
| 002  | Fix duplicate tests and add /hello-world route coverage | -          | completed |

## Architecture Notes

- **Fee ID format**: The Admin UI SDK docs state: "We recommend using the format: `<extensionId>::<fee/discountName>`". The extension's manifest ID is `delivery-fee-rules`. So `delivery-fee-us-ca` should become `delivery-fee-rules::us-ca`.
- **Why this matters**: The Admin SDK uses the `id` to correlate fees across registrations. Using the recommended format prevents collisions between extensions and aligns with how Adobe tracks fees in the order system.
- **Test duplication root cause**: The previous TDD cycles for tasks 004, 009, 010 each added assertions independently — some overlapped.
- **The `/hello-world` route** was added to `App.jsx` by the hello-world plan but that plan's tests only covered `HelloWorldPanel.jsx` in isolation, not the routing integration in `App.test.jsx`.

## Risks & Mitigations

- Changing fee IDs is a breaking change for any saved orders that already have these fees applied. Acceptable here since this is a new/dev deployment with no production orders.
