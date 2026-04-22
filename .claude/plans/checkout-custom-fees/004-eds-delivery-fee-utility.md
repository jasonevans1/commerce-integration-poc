# Task 004: EDS -- Delivery Fee Utility (Fetch from Calculate Action)

**Status**: pending
**Depends on**: none
**Retry count**: 0

## Description

Create a utility module in the EDS storefront (`/Users/jevans03/projects/storefront-poc/scripts/delivery-fee.js`) that fetches the delivery fee from the App Builder `calculate` action. This is the **primary** path for fee display -- the Commerce webhook (tasks 001-003) injects fees into REST responses for order totals, but the EDS storefront uses GraphQL, so webhook-injected total segments are not visible in the `CartModel`.

## Context

- Working directory for this task: `/Users/jevans03/projects/storefront-poc`
- Related files:
  - `scripts/rewards.js` -- reference pattern for a utility that fetches custom cart data
  - `blocks/commerce-checkout/containers.js` -- consumer of this utility (task 005)
  - `scripts/configs.js` or `scripts/config.js` -- how the storefront reads configuration values (App Builder action URL)

- The `CartModel` from `@dropins/storefront-cart` has NO `totalSegments`, `total_segments`, or `customAmounts` field. Custom total segments injected by Commerce webhooks on REST endpoints do not flow through GraphQL queries. Therefore this utility calls the App Builder `calculate` action directly.

- App Builder calculate endpoint URL: read from site config (same pattern as other App Builder URLs in the storefront -- check how existing API calls are made in `scripts/` or `blocks/`). The existing `calculate` action accepts `{ country, region, subtotal, currency }` and returns `{ fee, name, currency }`.

- The `CartModel` address data uses these paths:
  - `cartData.addresses?.shipping?.[0]?.countryCode` for shipping country
  - `cartData.addresses?.shipping?.[0]?.regionCode` for shipping region
  - `cartData.subtotal?.excludingTax` for subtotal `{ value, currency }`

## Requirements (Test Descriptions)

- [ ] `it calls the calculate endpoint with country, region, subtotal and currency`
- [ ] `it returns fee object with amount and label when calculate endpoint returns a fee`
- [ ] `it returns null when calculate endpoint returns fee of zero`
- [ ] `it returns null when calculate endpoint call fails`
- [ ] `it returns null when called with missing country`
- [ ] `it formats the fee amount as a number not a string`
- [ ] `it reads the calculate endpoint URL from site config`
- [ ] `it extracts shipping address and subtotal from CartModel correctly`

## Acceptance Criteria

- All requirements have passing tests (Jest or whichever test runner the storefront uses)
- `scripts/delivery-fee.js` exports:
  - `fetchDeliveryFee({ country, region, subtotal, currency })` -- calls App Builder calculate endpoint, returns `{ amount, label }` or `null`
  - `getDeliveryFeeParams(cartData)` -- extracts `{ country, region, subtotal, currency }` from `CartModel` or returns `null` if address is not set
- No hardcoded App Builder URLs -- read from config
- Handles fetch errors gracefully (returns null, logs to console.warn)

## Implementation Notes

- The `fetchDeliveryFee` function is the primary and only path (no segment extraction from cart data)
- The existing `calculate` action at `actions/delivery-fee/calculate/index.js` accepts params: `country`, `region`, `subtotal`, `currency` and returns `{ fee, name, currency }`
- Zero-fee case: if response `fee === 0`, return `null` (no fee applies -- don't display a $0.00 line)
- The App Builder `calculate` action URL pattern: `{RUNTIME_URL}/api/v1/web/{PACKAGE}/delivery-fee/calculate` -- confirm by checking how other App Builder URLs are resolved in the storefront project
- `getDeliveryFeeParams(cartData)` reads from `CartModel`:
  - Country: `cartData.addresses?.shipping?.[0]?.countryCode`
  - Region: `cartData.addresses?.shipping?.[0]?.regionCode`
  - Subtotal: `cartData.subtotal?.excludingTax?.value`
  - Currency: `cartData.subtotal?.excludingTax?.currency`
  - Returns `null` if country is not available (no shipping address yet)
