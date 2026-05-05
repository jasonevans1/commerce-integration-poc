# Plan: Delivery Fee via OOP Tax + Storefront Display

## Created

2026-05-04

## Status

completed

## Objective

Fold the delivery fee into the OOP `collect-taxes` webhook so it is captured in the Commerce order at placement, then display it as a named breakdown alongside the flat-rate tax in the EDS storefront order summary.

## Related Issues

none

## Key Architecture Decision

The `oopQuote` payload confirmed to include:

- `ship_to_address.country` — ISO country code
- `ship_to_address.region_code` — region/state code

This means the `collect-taxes` action can look up the delivery fee rule from I/O State using the same `getRule(country, region)` function already built in `actions/delivery-fee/lib/state-service.js`. The fee is distributed proportionally across items as a second `tax_breakdown` entry, summed into the per-item `tax.amount`.

**Why this is right:**

- OOP tax webhook fires during BOTH REST and GraphQL checkout, including `placeOrder` — the fee is in the actual order record
- The storefront reads `totalTax.value` from GraphQL which now includes both flat-rate tax and delivery fee
- The storefront calls `calculate` to know the fee amount separately, computes `tax = totalTax - fee` for the labelled breakdown

## Previous Approach (Abandoned)

`checkout-custom-fees` plan used `cart_total_repository.get` webhook (REST-only). This webhook does NOT fire during GraphQL `placeOrder` — the fee was display-only and never applied to the order.

## Why This Failed Before (Storefront Display)

1. **GraphQL ≠ REST**: The EDS storefront uses GraphQL. Webhook-injected REST total segments are invisible in the GraphQL `CartModel`. The storefront must call App Builder `calculate` directly for fee display.
2. **`renderContainer` caching**: Re-calling `renderOrderSummary()` is a no-op. Use mutable state ref + `cartApi.refreshCart()` (reward points pattern).

## Scope

### In Scope

**App Builder (`commerce-integration-poc`):**

- `actions/tax/collect-taxes/pre.js` — extract `ship_to_address` fields
- `actions/tax/collect-taxes/sender.js` — look up fee rule from I/O State (was no-op)
- `actions/tax/collect-taxes/transformer.js` — distribute fee across items + second `tax_breakdown`
- `actions/tax/collect-taxes/validator.js` — gracefully handle missing `ship_to_address`
- `test/actions/tax/collect-taxes/collect-taxes.test.js` — cover fee distribution

**Storefront (`storefront-poc`):**

- `scripts/delivery-fee.js` — utility calling App Builder `calculate` action
- `blocks/commerce-checkout/containers.js` — `deliveryFeeState` + `updateLineItems` breakdown
- `blocks/commerce-checkout/commerce-checkout.js` — address-change handler

### Out of Scope

- Changes to `webhook-quote-total` (still deployed; harmless for REST clients)
- Changes to delivery fee CRUD actions (rules-create, rules-get, etc.)
- Delivery fee on order confirmation, invoices, or email
- Admin UI changes

## Success Criteria

- [ ] When a customer places an order, the Commerce order record includes the delivery fee in the tax total
- [ ] The OOP `collect-taxes` action returns TWO `tax_breakdown` entries per item: one for flat-rate tax, one for delivery fee
- [ ] When no fee rule matches the address, `collect-taxes` behaves exactly as before (single tax breakdown, no fee)
- [ ] The EDS storefront shows "Tax (10%): $X" and "Delivery Fee: $Y" as labelled breakdown items
- [ ] The breakdown items only appear when the delivery fee is non-zero and tax is non-zero
- [ ] Shipping address changes at checkout update the fee display reactively
- [ ] All tests pass

## Task Overview

| Task | Description                                                                   | Repo        | Depends On | Status    |
| ---- | ----------------------------------------------------------------------------- | ----------- | ---------- | --------- |
| 001  | `collect-taxes/pre.js` — extract ship_to_address                              | App Builder | -          | completed |
| 002  | `collect-taxes/sender.js` — look up fee rule from I/O State                   | App Builder | 001        | completed |
| 003  | `collect-taxes/transformer.js` — fee distribution + two tax_breakdown entries | App Builder | 001, 002   | completed |
| 004  | `collect-taxes/validator.js` — graceful skip when ship_to_address missing     | App Builder | -          | completed |
| 005  | Update `collect-taxes` tests to cover fee distribution                        | App Builder | 003, 004   | completed |
| 006  | `scripts/delivery-fee.js` — storefront App Builder calculate client           | Storefront  | -          | completed |
| 007  | `containers.js` — `deliveryFeeState` + delivery fee line item                 | Storefront  | 006        | completed |
| 008  | `containers.js` — tax + delivery fee breakdown display                        | Storefront  | 007        | completed |
| 009  | `commerce-checkout.js` — address-change handler + state refresh               | Storefront  | 006, 007   | completed |

## Dependency Graph

```
001 ──► 002 ──► 003 ──► 005
001 ──► 004 ──────────► 005

006 ──► 007 ──► 008
            └──► 009
```

Parallel batch 1: 001, 006
Parallel batch 2: 002, 004, 007
Parallel batch 3: 003, 008, 009
Batch 4: 005

## Architecture Notes

### OOP Tax Webhook Confirmed Payload

```json
{
  "oopQuote": {
    "quote_id": "int",
    "customer_tax_class": "string",
    "items": [{ "code", "type", "tax_class", "unit_price", "quantity",
                "is_tax_included", "discount_amount", "custom_attributes",
                "sku", "name", "tax", "tax_breakdown" }],
    "ship_to_address": { "street", "city", "region", "region_code", "country", "postcode" },
    "ship_from_address": { ... },
    "billing_address": { ... },
    "shipping": { "shipping_method", "shipping_description" },
    "customer": { "entity_id", "website_id", "group_id", "email", ... }
  }
}
```

### Fee Distribution Algorithm

Delivery fee rules are cart-level (one fee per cart). The OOP webhook works per-item, so the fee must be distributed across items.

**Fixed fee**: proportional to each item's line subtotal (`unit_price × quantity`). Remainder (from rounding) assigned to last item.

**Percentage fee**: natural per-item calculation (`line_subtotal × rate / 100`). No distribution needed.

```
totalSubtotal = Σ round2(item.unit_price × item.quantity)
feePortion[i] = round2(totalFee × lineSubtotal[i] / totalSubtotal)
// Apply remainder to last item to guarantee exact total
feePortion[last] += round2(totalFee - Σ feePortion)
```

### Per-Item Patch Operations (with fee)

For each item two `add tax_breakdown` ops + one `replace tax` op:

```json
[
  {
    "op": "add",
    "path": "oopQuote/items/0/tax_breakdown",
    "value": {
      "data": {
        "code": "flat-rate-tax",
        "rate": 10,
        "amount": 8.5,
        "title": "Tax",
        "tax_rate_key": "flat-rate-tax-10"
      }
    },
    "instance": "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface"
  },
  {
    "op": "add",
    "path": "oopQuote/items/0/tax_breakdown",
    "value": {
      "data": {
        "code": "delivery-fee",
        "rate": 0,
        "amount": 4.99,
        "title": "California Flat Fee",
        "tax_rate_key": "delivery-fee"
      }
    },
    "instance": "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface"
  },
  {
    "op": "replace",
    "path": "oopQuote/items/0/tax",
    "value": {
      "data": { "rate": 10, "amount": 13.49, "discount_compensation_amount": 0 }
    },
    "instance": "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxInterface"
  }
]
```

### State Service Import

`collect-taxes/sender.js` imports the existing state service via relative path:

```js
const { getRule } = require("../../delivery-fee/lib/state-service");
```

Webpack bundles it with the action. No new shared lib needed.

### Storefront Display

The storefront reads `cartApi.getCartDataFromCache()?.totalTax?.value` which now includes fee. It calls `calculate` to know the fee component:

- Tax label: `totalTax - deliveryFee`
- Delivery fee label: `deliveryFee`
- These roll up to: `totalTax`

### Address Shape in `checkout/updated` Payload

```js
const addr = data?.shippingAddresses?.[0];
const country = addr?.country?.code; // e.g. "US"
const region = addr?.region?.code ?? ""; // e.g. "CA"
```

## Risks & Mitigations

- **OOP webhook fires before fee rule is ready**: If I/O State has no rule for the address, `getRule` returns null — `sender.js` passes null to transformer → transformer produces single tax breakdown only (existing behavior). Graceful.
- **I/O State latency in tax webhook**: `collect-taxes` is marked `required="true"` in Commerce — if the state lookup adds >10s latency, Commerce blocks checkout. I/O State `get()` is typically <200ms. Acceptable. Set `softTimeout` on the webhook registration.
- **State outage blocks checkout**: Any thrown error from `getRule` is caught in `sender.js` and translated to `null` so checkout proceeds with tax-only behavior (fail open). Without this, an I/O State outage would block ALL checkouts.
- **Rounding of distributed fee**: Remainder is assigned to the last item. Edge case: single-item cart has no distribution issue. Multi-item: remainder is at most ±$0.01 per item.
- **`refreshCart()` → infinite loop**: The `lastFeeKey` guard in task 009 (country + region + subtotal) runs synchronously before any async work. A re-emitted `checkout/updated` with the same trio is a no-op. Subtotal is included so percentage-rule fees recompute when cart contents change.
- **Tax rate label hardcoded as "Tax (10%)"**: Tightly couples storefront to the deployed rate. Acceptable for POC; flagged with a `// TODO`.
- **Multi-`add` to same `tax_breakdown` path**: Standard JSON Patch semantics would have the second `add` overwrite the first. The Magento OOP module's tolerance for two `add` ops to the same scalar path is unverified. Task 003 includes a mandatory stage-deploy verification step. If two breakdown rows do not appear, switch to `tax_breakdown/-` (array-append) or indexed paths.
- **`tax.amount` vs `tax.rate` mismatch**: The combined `amount` (tax + fee) no longer equals `rate × subtotal / 100`. Task 003 keeps `rate` as the flat tax rate but flags this as a stage-verification item — Magento may override `amount` from `rate` and break display, in which case use an effective combined rate.
- **Stale `deliveryFeeState` between checkout sessions**: Task 009 resets the module-level state at the top of `decorate` so a re-entry to checkout does not flash a stale fee from a previous session.
