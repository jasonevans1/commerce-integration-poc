# Devil's Advocate Review: checkout-custom-fees

## Critical (Must fix before building)

### C1: CartModel has no totalSegments/customAmounts -- webhook total segments do NOT reach the GraphQL-based storefront (tasks 004, 005, 006, \_plan.md)

The plan assumes the Commerce synchronous webhook injects a total segment into the REST API response, and that segment will appear in `cartData.prices.customAmounts` or `cartData.totalSegments`. However:

- The `CartModel` from `@dropins/storefront-cart` (see `data/models/cart-model.d.ts`) has no `totalSegments`, `total_segments`, or `customAmounts` field.
- The EDS storefront fetches cart data via **GraphQL**, not the REST `cart_total_repository.get` endpoint.
- Commerce synchronous webhooks on `cart_total_repository.get` only modify the REST response. The GraphQL `cart` query uses a completely different code path.
- Therefore `extractDeliveryFee(cartData)` will **never** find the fee in the cart data model. The entire "primary path" (webhook-injected segment read on the frontend) is architecturally broken.

**Fix:** The EDS storefront tasks (004, 005, 006) must use the `fetchDeliveryFee()` fallback as the **primary** path -- calling the App Builder `calculate` endpoint directly from the storefront whenever a shipping address is known. The `extractDeliveryFee` function should be removed or demoted to a "future enhancement" note. Alternatively, the backend approach needs to switch to a GraphQL resolver extension, which is a fundamentally different architecture.

### C2: renderContainer prevents re-rendering of OrderSummary (task 006)

Task 006 proposes calling `renderOrderSummary(summaryContainer)` when the address changes to refresh the fee display. However, `renderContainer` (containers.js line 146-159) checks `registry.has(id)` and immediately returns the cached instance without re-executing the render function. The order summary will render exactly once and never update.

**Fix:** Task 006 cannot simply call `renderOrderSummary()` again. Options:

1. Use `unmountContainer(CONTAINERS.ORDER_SUMMARY)` before re-calling `renderOrderSummary()`.
2. Use the existing `setProps` API from the registry to update `updateLineItems` dynamically.
3. Use an event-driven approach where the `updateLineItems` callback reads from a mutable state reference (similar to how `rewardLineState` works).

Option 3 is most consistent with the existing reward points pattern -- `rewardLineState` is a mutable object read by the `updateLineItems` closure. The delivery fee should follow the same pattern with a `deliveryFeeState` ref.

However, even this won't work because `updateLineItems` is only called when the OrderSummary container itself decides to re-render (e.g., when cart data changes via GraphQL). The callback doesn't get re-invoked on arbitrary external events. The real solution is: since we're calling `fetchDeliveryFee` (per C1 fix), we need to trigger a cart refresh (`cartApi.refreshCart()`) after updating the fee state, which will cause OrderSummary to re-render and invoke `updateLineItems` again.

## Important (Should fix before building)

### I1: checkout/updated event payload shape is wrong (task 006)

Task 006 references `checkoutData?.shippingAddress` (singular) with `addr.countryCode` and `addr.regionCode`. The actual `checkout/updated` event payload is the checkout `Cart` model which has:

- `shippingAddresses: CartShippingAddress[]` (array, not singular)
- Each address has `country: { code, label }` (not `countryCode`)
- Each address has `region?: { code, id, name }` (not `regionCode`)

The correct access is:

```js
const addr = checkoutData?.shippingAddresses?.[0];
const feeKey = addr ? `${addr.country?.code}:${addr.region?.code ?? ""}` : null;
```

### I2: actions.config.yaml entry missing runtime: nodejs:22 (task 001)

Every existing action in `actions/delivery-fee/actions.config.yaml` specifies `runtime: nodejs:22`. The task 001 implementation notes omit it. Without it, the action may deploy on a default (older) Node.js runtime.

### I3: Task 005 references incorrect cartData property paths (task 005)

The implementation notes reference `cartData?.shippingAddress?.countryCode` and `cartData.prices?.subtotalExcludingTax`. The actual `CartModel` from `@dropins/storefront-cart` uses:

- `cartData.addresses?.shipping?.[0]?.countryCode` for shipping country
- `cartData.subtotal?.excludingTax` for subtotal (not `prices.subtotalExcludingTax`)

### I4: Task 002 handler pipeline misplaces responsibilities (task 002)

The acceptance criteria say "sendData in sender.js calls stateService.getRule()" and "Fee computation logic is in transformer.js". But looking at the existing `calculate` action pattern: `sendData` does the I/O (state lookup), `transformData` does computation, and `postProcess` formats the response. Task 002's acceptance criteria match this correctly, but the implementation notes for `post.js` say it "assembles the JSON Patch array response" which is correct. The requirement "it returns 200 with empty patch array when region_code is absent but country matches a rule" is ambiguous -- does the handler look up by country only when region is absent? The existing `getRule(country, region)` requires both; it builds `rule.{COUNTRY}.{REGION}` key. If region is empty/absent, the lookup key becomes `rule.US.` which won't match any rule stored as `rule.US.CA`.

**Fix:** Clarify behavior: when `region_code` is absent, the handler should attempt lookup with an empty region string, which will result in no match (return empty patch). The test description should be updated to reflect this accurately: "it returns 200 with empty patch array when region_code is absent (no rule match possible)".

### I5: Task 003 webhooks.xml has no deployment mechanism in place (task 003)

The plan references `.commerce-to-app-builder/webhooks.xml` as the standard location, but this directory does not exist in the project and there's no established deployment pipeline for webhook XML. The `webhooks.xml` registration for SaaS Commerce requires either:

1. Deploying via `aio commerce:webhooks:subscribe` CLI
2. Uploading via Commerce Admin > System > Webhooks
3. Including in a Commerce module (not applicable for SaaS)

The task should document the actual deployment step and not just create a file that sits inert.

### I6: Task 002 is too large for a single TDD cycle (task 002)

Task 002 has 12 test requirements across 6 files with business logic in validator, pre, transformer, sender, and post. This is effectively implementing the entire webhook handler. The existing `calculate` action tests are in a single test file covering all 6 handler files, so this follows precedent, but the handler logic here is more complex (JSON Patch assembly, grand total mutation). Consider splitting into 002a (validator + pre + sender) and 002b (transformer + post + index integration).

## Minor (Nice to address)

### M1: sortOrder 600 for delivery fee, 650 for rewards -- no documentation of sort order convention

There's no centralized documentation of sort order ranges. Future line items added by other developers won't know what's taken.

### M2: Currency formatting in task 005 uses Intl.NumberFormat inline

The reward points pattern already uses `Intl.NumberFormat` inline. Consider extracting a shared formatter since task 005 will duplicate this.

### M3: No CORS consideration for fetchDeliveryFee

If the storefront calls the App Builder `calculate` endpoint directly, the action must return CORS headers. The existing `calculate` action returns `{ statusCode, body }` without explicit CORS headers -- App Builder web actions typically handle this automatically with `web: 'yes'`, but verify this works with the EDS storefront origin.

### M4: The plan mentions `COMMERCE_BASE_URL` input for the webhook action but it is never used

The webhook handler reads from I/O State only. It never calls Commerce APIs. The `COMMERCE_BASE_URL` input in task 001 is unnecessary.

## Questions for the Team

1. **Is the Commerce synchronous webhook approach viable at all for SaaS + EDS (GraphQL)?** Since the storefront uses GraphQL and webhooks modify REST responses, the webhook-injected total segment will never be visible to the storefront. Should the entire backend approach (tasks 001-003) be reconsidered? The webhook may still be valuable for ensuring the order record in Commerce includes the fee, but it won't help with storefront display.

2. **Should the delivery fee affect the actual Commerce grand total?** If the webhook only modifies the REST response and the GraphQL response is unaffected, the order placed via GraphQL won't include the fee in its grand total. This means the fee is display-only on the storefront, not actually charged. Is this acceptable for a POC, or does the fee need to be part of the actual order?

3. **What happens to the webhook approach when the order is placed?** Even if we solve the display issue, does the `cart_total_repository.get` webhook also fire during order placement, and does the injected total segment persist to the order? If not, the fee is never actually charged.

4. **Is there an existing pattern in this project for the EDS storefront calling App Builder actions directly?** Task 004 needs to know how the storefront resolves App Builder URLs (config, hardcoded, environment variable in `configs.xlsx`, etc.).
