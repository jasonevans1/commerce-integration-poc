# Task 006: Create `scripts/delivery-fee.js` — Storefront Calculate Client

**Status**: pending
**Depends on**: none
**Retry count**: 0

## Description

Create `scripts/delivery-fee.js` in the storefront-poc repo. Exports `fetchDeliveryFee(country, region, subtotal, currency)` which calls the App Builder `calculate` action and returns `{ fee, name, currency }`. Used by the checkout address-change handler to know the delivery fee amount for display in the order summary breakdown (tax label = `totalTax - fee`, delivery fee label = `fee`).

## Context

- **Repo**: `/Users/jevans03/projects/storefront-poc`
- **New file**: `scripts/delivery-fee.js`
- **App Builder `calculate` action**: GET endpoint accepting `country`, `region`, `subtotal`, `currency` query params. Returns `{ fee, name, currency }`. Returns `{ fee: 0, name: "No delivery fee applies" }` when no rule matches.
- **URL config**: `getConfigValue('app-builder-calculate-url')` from `@dropins/tools/lib/aem/configs.js`
- **Pattern**: follow `scripts/rewards.js` module structure
- **Why subtotal is passed**: for percentage-type fee rules the `calculate` action needs the subtotal to compute the fee amount. Even though the OOP webhook handles the actual charging, the storefront needs the correct amount for display.

## Requirements (Test Descriptions)

- [ ] `it returns fee and name from a successful calculate action response`
- [ ] `it returns fee 0 and name null when no app-builder-calculate-url config value is set`
- [ ] `it returns fee 0 and name null when country is falsy`
- [ ] `it returns fee 0 and name null when the fetch request throws a network error`
- [ ] `it returns fee 0 and name null when the response is not ok`
- [ ] `it builds the correct query string with country, region, subtotal, and currency`
- [ ] `it does not include "undefined" in the query string when region is missing`
- [ ] `it passes currency through in the returned object`

## Acceptance Criteria

- All requirements have passing tests
- Function signature: `fetchDeliveryFee(country, region, subtotal, currency): Promise<{ fee: number, name: string|null, currency: string }>`
- Graceful fallback to `{ fee: 0, name: null, currency }` on any error
- Config key: `app-builder-calculate-url`
- No hardcoded URLs

## Implementation Notes

```js
import { getConfigValue } from "@dropins/tools/lib/aem/configs.js";

export async function fetchDeliveryFee(country, region, subtotal, currency) {
  const baseUrl = getConfigValue("app-builder-calculate-url");
  if (!baseUrl || !country)
    return { fee: 0, name: null, currency: currency ?? "USD" };
  try {
    const params = new URLSearchParams({
      country,
      region: region ?? "",
      subtotal: String(subtotal ?? 0),
      currency: currency ?? "USD",
    });
    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok)
      return { fee: 0, name: null, currency: currency ?? "USD" };
    const data = await response.json();
    return {
      fee: data.fee ?? 0,
      name: data.name ?? null,
      currency: currency ?? "USD",
    };
  } catch {
    return { fee: 0, name: null, currency: currency ?? "USD" };
  }
}
```
