# Task 009: `commerce-checkout.js` — Address-Change Handler + State Refresh

**Status**: pending
**Depends on**: [006, 007]
**Retry count**: 0

## Description

Update `blocks/commerce-checkout/commerce-checkout.js` to detect when the shipping address changes via the `checkout/updated` event, call `fetchDeliveryFee` with the new address, update `deliveryFeeState`, and call `cartApi.refreshCart()` to trigger OrderSummary re-render with the updated breakdown.

## Context

- **Repo**: `/Users/jevans03/projects/storefront-poc`
- **File**: `blocks/commerce-checkout/commerce-checkout.js`
- **`handleCheckoutUpdated`**: existing function at line 299, currently calls `initializeCheckout(data)`. Extend with address-detection logic.
- **Payload shape** (CORRECT):
  ```js
  const addr = data?.shippingAddresses?.[0];
  const country = addr?.country?.code; // "US"
  const region = addr?.region?.code ?? ""; // "CA"
  // WRONG: data?.shippingAddress?.countryCode — does not exist
  ```
- **Subtotal**: `cartApi.getCartDataFromCache()?.subtotal?.excludingTax?.value ?? 0`
- **Currency**: `cartApi.getCartDataFromCache()?.subtotal?.excludingTax?.currency ?? 'USD'`
- **`cartApi`**: add `import * as cartApi from '@dropins/storefront-cart/api.js'` if not already present
- **Loop prevention**: `lastFeeKey` guard MUST run synchronously BEFORE any async work. `refreshCart()` can re-emit `checkout/updated` — without the guard this is an infinite loop. The cache key MUST include both address AND subtotal so that adding/removing items recomputes percentage-based fees: `${country}:${region}:${subtotal}`.
- **Skip refresh**: when previous and new fee are BOTH zero AND the same, skip `refreshCart()` to avoid unnecessary re-renders.
- **`refreshCart` fallback**: if `typeof cartApi.refreshCart !== 'function'`, fall back to `events.emit('cart/data', cartApi.getCartDataFromCache())`.
- **Reset state on `decorate`**: the `deliveryFeeState` from task 007 is module-level and persists across navigation. Reset it to `{ fee: 0, name: null, currency: 'USD' }` at the top of `decorate` so a re-entry to checkout does not show a stale fee from the previous session before the address handler fires.
- **Order of operations**: update `deliveryFeeState` BEFORE calling `refreshCart()` so the OrderSummary's `updateLineItems` callback sees the new state when it re-renders. The OOP webhook will recompute server-side `totalTax` during the cart refresh, so `cartApi.getCartDataFromCache()` at the time of re-render will reflect the correct combined total.

## Requirements (Test Descriptions)

- [ ] `it calls fetchDeliveryFee when checkout/updated fires with a new shipping address`
- [ ] `it updates deliveryFeeState.fee with the returned fee`
- [ ] `it updates deliveryFeeState.name with the returned name`
- [ ] `it updates deliveryFeeState.currency with the cart currency`
- [ ] `it calls cartApi.refreshCart after updating deliveryFeeState when fee changed`
- [ ] `it does not call fetchDeliveryFee when shippingAddresses is empty or undefined`
- [ ] `it does not call fetchDeliveryFee when country/region/subtotal trio has not changed since the last call`
- [ ] `it re-fetches the fee when the subtotal changes even if the address has not (percentage rule support)`
- [ ] `it does not enter an infinite loop when refreshCart re-emits checkout/updated with same address`
- [ ] `it skips refreshCart when the previous fee and new fee are both zero`
- [ ] `it passes the cart subtotal to fetchDeliveryFee`
- [ ] `it resets deliveryFeeState.fee to 0 when fetchDeliveryFee returns fee 0`
- [ ] `it resets deliveryFeeState in decorate so a re-entry to checkout does not show a stale fee`

## Acceptance Criteria

- All requirements have passing tests
- `lastFeeKey` is declared in `decorate` function scope (persists across `handleCheckoutUpdated` calls) and includes country, region, and subtotal
- `deliveryFeeState` is reset to defaults at the top of `decorate` to prevent stale-fee bleed between checkout sessions
- `refreshCart()` is called only when fee transitions (zero→non-zero, non-zero→zero, or non-zero→different non-zero)
- No double-fetch when same address re-submitted
- Code passes `npm run lint`

## Implementation Notes

Imports to add at top of file:

```js
import { fetchDeliveryFee } from "../../scripts/delivery-fee.js";
import { deliveryFeeState } from "./containers.js";
import * as cartApi from "@dropins/storefront-cart/api.js"; // if not already present
```

At the top of `decorate`, reset module-level state and declare the guard key:

```js
// Reset the module-level fee state so a re-entry to checkout starts clean.
deliveryFeeState.fee = 0;
deliveryFeeState.name = null;
deliveryFeeState.currency = "USD";

let lastFeeKey = null;
```

Replace `handleCheckoutUpdated` with:

```js
async function handleCheckoutUpdated(data) {
  if (!data) return;
  await initializeCheckout(data);

  const addr = data?.shippingAddresses?.[0];
  if (!addr?.country?.code) return;

  const country = addr.country.code;
  const region = addr.region?.code ?? "";

  const cartData = cartApi.getCartDataFromCache();
  const subtotal = cartData?.subtotal?.excludingTax?.value ?? 0;
  const currency = cartData?.subtotal?.excludingTax?.currency ?? "USD";

  // Loop guard MUST run synchronously before any async call. Includes subtotal so
  // percentage-rule fees recompute when the cart contents change.
  const feeKey = `${country}:${region}:${subtotal}`;
  if (feeKey === lastFeeKey) return;
  lastFeeKey = feeKey;

  const previousFee = deliveryFeeState.fee;
  const { fee, name } = await fetchDeliveryFee(
    country,
    region,
    subtotal,
    currency,
  );
  deliveryFeeState.fee = fee;
  deliveryFeeState.name = name;
  deliveryFeeState.currency = currency;

  if (previousFee === 0 && fee === 0) return; // nothing visible changed

  if (typeof cartApi.refreshCart === "function") {
    await cartApi.refreshCart();
  } else {
    events.emit("cart/data", cartApi.getCartDataFromCache());
  }
}
```
