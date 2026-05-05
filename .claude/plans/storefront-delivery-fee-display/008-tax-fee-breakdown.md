# Task 008: `containers.js` — Tax + Delivery Fee Breakdown Display

**Status**: pending
**Depends on**: [007]
**Retry count**: 0

## Description

Extend the `updateLineItems` callback in `renderOrderSummary` to show the tax amount and delivery fee as two labelled sub-items when both are non-zero. The tax amount is derived as `totalTax.value - deliveryFeeState.fee` (because the OOP webhook now includes the fee in the tax total). Both items appear as indented sub-entries immediately after the existing "Tax" line item.

**Discovery step (required before coding):** Add a temporary `console.log('lineItems', JSON.stringify(lineItems.map(i => ({ key: i.key, sortOrder: i.sortOrder }))))` inside `updateLineItems` and load checkout to find the actual key and sortOrder of the dropin's "Tax" entry. Position breakdown items relative to that discovered value.

## Context

- **Repo**: `/Users/jevans03/projects/storefront-poc`
- **File**: `blocks/commerce-checkout/containers.js` (same file as task 007)
- **Tax total source**: `cartApi.getCartDataFromCache()?.totalTax?.value` — includes BOTH flat-rate tax AND delivery fee (because OOP webhook now adds both)
- **Tax label amount**: `totalTax.value - deliveryFeeState.fee` (the flat-rate component only)
- **Delivery fee label amount**: `deliveryFeeState.fee`
- **Only show TWO sub-entries when**: `deliveryFeeState.fee > 0` AND `(totalTax.value - deliveryFeeState.fee) > 0` (i.e. flat tax is also non-zero). When the flat tax component is zero (TAX_RATE_PERCENT=0 or no taxable items) but a fee exists, suppress the "Tax (10%)" sub-entry and let the standalone "Delivery Fee" line item from task 007 carry the fee — do NOT render a `$0.00` tax line.
- **Position**: use runtime lookup `result.find(i => /tax/i.test(i.key))` to find the Tax item's sortOrder. Use INTEGER offsets (`taxBase + 1` and `taxBase + 2`) — fractional offsets like `taxBase + 0.1` are at risk if the OrderSummary dropin coerces sortOrder to integer or sorts by string. If `taxBase + 1` collides with an adjacent item's sortOrder, increase the gap. Default `taxBase = 700` only if no Tax item is found.
- **`cartApi`**: already imported at line 33 of `containers.js`
- **Hardcoded label "Tax (10%)"**: tightly coupled to `TAX_RATE_PERCENT=10`. Add `// TODO: source tax rate from a config or calculate response` comment and acknowledge in the task summary. Do NOT block on this for the POC.

## Requirements (Test Descriptions)

- [ ] `it injects a "Tax (10%)" breakdown item when both tax and delivery fee are non-zero`
- [ ] `it injects a "Delivery Fee" breakdown item when both tax and delivery fee are non-zero`
- [ ] `it does not inject breakdown items when delivery fee is zero`
- [ ] `it does not inject breakdown items when totalTax is zero or unavailable`
- [ ] `it does not inject the "Tax" sub-entry when the flat tax component (totalTax - fee) is zero`
- [ ] `it sets the tax breakdown amount to totalTax minus the delivery fee`
- [ ] `it formats tax breakdown amount as currency using Intl.NumberFormat`
- [ ] `it formats delivery fee breakdown amount as currency using Intl.NumberFormat`
- [ ] `it reads tax total from cartApi.getCartDataFromCache().totalTax.value`
- [ ] `it positions tax breakdown item at sortOrder taxBase + 1 (integer offset, not fractional)`
- [ ] `it positions delivery fee breakdown item at sortOrder taxBase + 2 (integer offset)`
- [ ] `it falls back to sortOrder 700 when no Tax line item key matches /tax/i`
- [ ] `it applies cart-order-summary__sub-entry CSS class to breakdown items`

## Acceptance Criteria

- All requirements have passing tests
- Breakdown only appears when delivery fee > 0 AND totalTax > 0
- The tax breakdown amount is `totalTax - fee`, not the raw flat-rate percentage (the OOP webhook already rolled the fee into totalTax)
- Existing "Tax" dropin line item is NOT removed (it shows the combined total; breakdown items are sub-entries)
- Remove temporary `console.log` before committing
- Code passes `npm run lint`

## Implementation Notes

Inside `updateLineItems`, after the delivery fee injection from task 007:

```js
const currentCartData = cartApi.getCartDataFromCache();
const totalTax = currentCartData?.totalTax?.value ?? 0;
const taxCurrency =
  currentCartData?.totalTax?.currency ?? deliveryFeeState.currency;

if (deliveryFeeState.fee > 0 && totalTax > 0) {
  const flatTaxAmount = Math.max(
    0,
    Math.round((totalTax - deliveryFeeState.fee) * 100) / 100,
  );
  const feeFormatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: deliveryFeeState.currency,
  }).format(deliveryFeeState.fee);

  const taxItem = result.find((i) => /tax/i.test(i.key));
  const taxBase = taxItem?.sortOrder ?? 700;

  // Only show the "Tax (10%)" sub-entry when the flat-rate tax component is non-zero.
  // If the cart has no taxable items but a delivery fee applies, suppress the $0.00 tax line.
  if (flatTaxAmount > 0) {
    const taxFormatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: taxCurrency,
    }).format(flatTaxAmount);
    result = [
      ...result,
      {
        key: "taxBreakdown",
        sortOrder: taxBase + 1, // TODO: source rate label from config; integer gap avoids float-sort risk
        content: h(
          "div",
          {
            className:
              "cart-order-summary__entry cart-order-summary__sub-entry",
          },
          h("span", { className: "cart-order-summary__label" }, "Tax (10%)"),
          h("span", { className: "cart-order-summary__price" }, taxFormatted),
        ),
      },
    ];
  }

  result = [
    ...result,
    {
      key: "deliveryFeeBreakdown",
      sortOrder: taxBase + 2,
      content: h(
        "div",
        {
          className: "cart-order-summary__entry cart-order-summary__sub-entry",
        },
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
