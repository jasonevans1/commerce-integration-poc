# Task 001: Update `collect-taxes/pre.js` — Extract `ship_to_address`

**Status**: pending
**Depends on**: none
**Retry count**: 0

## Description

Update `actions/tax/collect-taxes/pre.js` to decode and extract `ship_to_address.country` and `ship_to_address.region_code` from the `oopQuote` payload, alongside the existing `items` and `taxRatePercent`. These fields are passed to sender and transformer so the delivery fee rule can be looked up.

## Context

- **Repo**: `/Users/jevans03/projects/commerce-integration-poc`
- **File**: `actions/tax/collect-taxes/pre.js`
- **Confirmed payload**: `oopQuote.ship_to_address` exists with fields `country` (ISO code, e.g. `"US"`) and `region_code` (e.g. `"CA"`)
- **Current `preProcess` output**: `{ items, taxRatePercent }`
- **New output**: `{ items, taxRatePercent, country, region }` — `country` and `region` are uppercased strings (matching how delivery-fee state keys are stored: `rule.US.CA`)
- If `ship_to_address` is absent or `country` is missing, return `country: null, region: ''` — the sender will handle the null-country case gracefully

## Requirements (Test Descriptions)

- [ ] `it extracts country from oopQuote.ship_to_address.country and uppercases it`
- [ ] `it extracts region from oopQuote.ship_to_address.region_code and uppercases it`
- [ ] `it returns country null and region empty string when ship_to_address is missing`
- [ ] `it returns country null and region empty string when ship_to_address.country is missing`
- [ ] `it still extracts items and taxRatePercent alongside the address fields`
- [ ] `it decodes base64 __ow_body before extracting address fields`

## Acceptance Criteria

- All requirements have passing tests
- `preProcess` returns `{ items, taxRatePercent, country, region }` in all paths
- Country and region are uppercased (matching state-service key convention)
- No changes to existing items/taxRatePercent extraction logic
- Code passes `npm run code:lint:fix && npm run code:format:fix`

## Implementation Notes

```js
function preProcess(params) {
  let oopQuote;
  if (params.__ow_body) {
    const decoded = Buffer.from(params.__ow_body, "base64").toString("utf8");
    oopQuote = JSON.parse(decoded).oopQuote;
  } else {
    oopQuote = params.oopQuote;
  }

  const { items } = oopQuote;
  const taxRatePercent =
    params.TAX_RATE_PERCENT !== undefined ? Number(params.TAX_RATE_PERCENT) : 0;

  const shipTo = oopQuote.ship_to_address;
  const country = shipTo?.country ? String(shipTo.country).toUpperCase() : null;
  const region = shipTo?.region_code
    ? String(shipTo.region_code).toUpperCase()
    : "";

  return { items, taxRatePercent, country, region };
}
```
