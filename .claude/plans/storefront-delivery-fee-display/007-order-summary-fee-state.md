# Task 007: `containers.js` — `deliveryFeeState` + Delivery Fee Line Item

**Status**: pending
**Depends on**: [006]
**Retry count**: 0

## Description

Update `blocks/commerce-checkout/containers.js` to add a module-level `deliveryFeeState` mutable reference and inject a "Delivery Fee" line item into the OrderSummary via `updateLineItems`. Export `deliveryFeeState` so `commerce-checkout.js` can update it when the shipping address changes.

## Context

- **Repo**: `/Users/jevans03/projects/storefront-poc`
- **File**: `blocks/commerce-checkout/containers.js`
- **Existing pattern**: `rewardLineState` is INSIDE `renderOrderSummary`'s async factory (function-scoped, not module-level). `deliveryFeeState` must be MODULE-LEVEL and exported — different pattern.
- **`renderOrderSummary`**: defined at line 468. Uses `renderContainer` caching — do NOT re-call it on address change.
- **`h` function**: already imported from `@dropins/tools/preact.js`
- **Intl.NumberFormat**: already used inline at line 483
- **Sort order**: `600` (reward points are `650`, delivery fee precedes)
- **Task 008** will add tax breakdown items using discovered tax item sort order — ensure no collision with 600

## Requirements (Test Descriptions)

- [ ] `it exports deliveryFeeState as a mutable object with fee, name, and currency properties`
- [ ] `it injects a delivery fee line item when deliveryFeeState.fee is greater than zero`
- [ ] `it does not inject a delivery fee line item when deliveryFeeState.fee is zero`
- [ ] `it formats the delivery fee using Intl.NumberFormat with deliveryFeeState.currency`
- [ ] `it uses deliveryFeeState.name as the label for the delivery fee line item`
- [ ] `it assigns sortOrder 600 to the delivery fee line item`
- [ ] `it applies cart-order-summary__entry CSS class to the delivery fee element`

## Acceptance Criteria

- All requirements have passing tests
- `deliveryFeeState` exported at module level: `export const deliveryFeeState = { fee: 0, name: null, currency: 'USD' }`
- Delivery fee injected in `updateLineItems` using same DOM structure as reward points
- No changes to existing reward points logic
- Code passes `npm run lint`

## Implementation Notes

Add near the top of `containers.js` (after imports, before function definitions):

```js
export const deliveryFeeState = { fee: 0, name: null, currency: "USD" };
```

Inside `renderOrderSummary`'s `updateLineItems` callback, after the reward points block:

```js
if (deliveryFeeState.fee > 0) {
  const feeFormatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: deliveryFeeState.currency,
  }).format(deliveryFeeState.fee);
  result = [
    ...result,
    {
      key: "deliveryFee",
      sortOrder: 600,
      content: h(
        "div",
        { className: "cart-order-summary__entry" },
        h(
          "span",
          { className: "cart-order-summary__label" },
          deliveryFeeState.name ?? "Delivery Fee",
        ),
        h("span", { className: "cart-order-summary__price" }, feeFormatted),
      ),
    },
  ];
}
```
