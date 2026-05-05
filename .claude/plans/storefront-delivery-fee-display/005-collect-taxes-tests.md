# Task 005: Update `collect-taxes` Tests — Fee Distribution + Two-Breakdown Coverage

**Status**: pending
**Depends on**: [003, 004]
**Retry count**: 0

## Description

Update `test/actions/tax/collect-taxes/collect-taxes.test.js` to cover the delivery fee integration: rule lookup via sender, proportional fee distribution across items, two `tax_breakdown` entries per item, correct combined `tax.amount`, and graceful no-fee behavior when `country` is absent or rule returns null.

## Context

- **Repo**: `/Users/jevans03/projects/commerce-integration-poc`
- **Test file**: `test/actions/tax/collect-taxes/collect-taxes.test.js`
- **Existing test pattern uses `jest.resetModules()` in `afterEach` (line 35).** Top-level `jest.mock` calls are wiped per test, so use `jest.doMock(absolutePath, factory)` BEFORE the per-test `require(path.join(ACTION_DIR, 'index.js'))` to mock `state-service`.
- The `state-service.js` module is loaded via `require('../../delivery-fee/lib/state-service')` from inside `sender.js`. The Jest mock target must resolve to the SAME absolute path. Use:
  ```js
  const STATE_SERVICE_PATH = path.resolve(
    __dirname,
    "../../../../actions/delivery-fee/lib/state-service",
  );
  jest.doMock(STATE_SERVICE_PATH, () => ({
    getRule: jest.fn().mockResolvedValue(rule),
  }));
  ```
- **Existing test "it sender returns the expected no-op shape" (current line 284-290) MUST be removed or rewritten** — `sendData` is no longer a no-op. Replace with a test asserting `sendData({ country: null })` returns null AND `sendData({ country: 'US', region: 'CA' })` returns the rule from the mock.
- **Existing test "it preProcess extracts the expected fields from the raw payload" (current line 292-315)** asserts the result has only `items` and `taxRatePercent`. Update assertions to also check `country` and `region` fields are present (null/empty when ship_to_address absent).
- **Existing test setup**: builds base64 payloads, exercises `main(params)` end-to-end
- **Key test pattern**: build `oopQuote` payload with `ship_to_address`, call `main(params)`, assert patch ops
- The validator-only coverage (`it returns success true from validator when ship_to_address is missing` etc.) lives in TASK 004. This task should NOT duplicate validator-only assertions — only end-to-end (`main()`-level) assertions belong here.

## Requirements (Test Descriptions)

- [ ] `it calls getRule with uppercased country and region from ship_to_address`
- [ ] `it returns two tax_breakdown ops per item when a fixed fee rule is returned`
- [ ] `it returns two tax_breakdown ops per item when a percentage fee rule is returned`
- [ ] `it distributes fixed fee proportionally across multiple items`
- [ ] `it assigns remainder to last item so fee portions sum exactly to the rule value`
- [ ] `it adds fee portion to the tax amount in the replace tax operation`
- [ ] `it returns single tax_breakdown ops per item when getRule returns null`
- [ ] `it does not call getRule when ship_to_address country is absent`
- [ ] `it returns single tax_breakdown ops when no ship_to_address is present in payload`
- [ ] `it returns 200 (single tax_breakdown only) when getRule throws — checkout must not be blocked by state outage`
- [ ] `it pre.js still extracts items and taxRatePercent and now also extracts country and region (replaces obsolete preProcess test)`
- [ ] `it sender returns the rule when country is provided and getRule resolves with a rule (replaces obsolete no-op-shape test)`

## Acceptance Criteria

- All requirements have passing tests
- All existing tests continue to pass
- `getRule` is mocked — no real I/O State calls
- Tests cover both `fixed` and `percentage` rule types
- Tests cover single-item and multi-item carts for fee distribution
- Code passes `npm run code:lint:fix && npm run code:format:fix`

## Implementation Notes

Test payload structure for fee tests:

```js
const payload = {
  oopQuote: {
    items: [
      {
        code: "item_1",
        unit_price: 60,
        quantity: 1,
        discount_amount: 0,
        is_tax_included: false,
      },
      {
        code: "item_2",
        unit_price: 40,
        quantity: 1,
        discount_amount: 0,
        is_tax_included: false,
      },
    ],
    ship_to_address: {
      country: "US",
      region_code: "CA",
      city: "LA",
      postcode: "90001",
    },
  },
};
const base64Body = Buffer.from(JSON.stringify(payload)).toString("base64");
const params = { __ow_body: base64Body, TAX_RATE_PERCENT: "10" };
```

Mock setup (must use `jest.doMock` because the existing suite calls `jest.resetModules()` in `afterEach`):

```js
const STATE_SERVICE_PATH = path.resolve(
  __dirname,
  "../../../../actions/delivery-fee/lib/state-service",
);

function withRule(rule) {
  jest.resetModules();
  jest.doMock(STATE_SERVICE_PATH, () => ({
    getRule: jest.fn().mockResolvedValue(rule),
  }));
  return require(path.join(ACTION_DIR, "index.js"));
}

function withRuleError(error) {
  jest.resetModules();
  jest.doMock(STATE_SERVICE_PATH, () => ({
    getRule: jest.fn().mockRejectedValue(error),
  }));
  return require(path.join(ACTION_DIR, "index.js"));
}
```

For fee rule tests:

```js
const action = withRule({
  country: "US",
  region: "CA",
  name: "CA Fee",
  type: "fixed",
  value: 10.0,
});
const response = await action.main(params);
```

For state-outage test:

```js
const action = withRuleError(new Error("state unavailable"));
const response = await action.main(params);
expect(response.statusCode).toBe(200); // fail open
```

Fee distribution assertion for two items ($60, $40, fixed $10 fee):

- Item 0: round2(10 × 60/100) = $6.00, taxAmount = round2(60 × 10/100) + 6.00 = $12.00
- Item 1: 10 - 6.00 = $4.00 (remainder), taxAmount = round2(40 × 10/100) + 4.00 = $8.00
