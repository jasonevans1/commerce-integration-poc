# Task 003: Update `collect-taxes/transformer.js` — Fee Distribution + Two `tax_breakdown` Entries

**Status**: pending
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Update `actions/tax/collect-taxes/transformer.js` to accept a delivery fee `rule` (from sender) alongside the existing `normalized` params, distribute the fee proportionally across items, and emit two `tax_breakdown` patch operations per item — one for the flat-rate tax, one for the delivery fee. The per-item `tax.amount` is updated to include both components. When `rule` is null (no matching rule), the output is identical to the existing behavior.

## Context

- **Repo**: `/Users/jevans03/projects/commerce-integration-poc`
- **File**: `actions/tax/collect-taxes/transformer.js`
- **Current signature**: `transformData(normalized)` → array of patch ops
- **New signature**: `transformData(normalized, rule)` — `rule` is `{ type, value, name }` or `null`
- **`index.js` call site**: currently `transformData(normalized)` — must be updated to `transformData(normalized, rule)` where `rule` comes from `sendData`
- **Existing patch op shape** (do not change):
  ```js
  { op: "add", path: "oopQuote/items/0/tax_breakdown",
    value: { data: { code, rate, amount, title, tax_rate_key } },
    instance: "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface" }
  { op: "replace", path: "oopQuote/items/0/tax",
    value: { data: { rate, amount, discount_compensation_amount: 0 } },
    instance: "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxInterface" }
  ```

### Multi-Breakdown Patch Path Verification (REQUIRED before claiming task complete)

Standard RFC 6902 JSON Patch `add` to a non-array path REPLACES the value. The Magento OOP tax module uses a non-standard interpretation, but no production evidence exists for two `add` operations to the same scalar `tax_breakdown` path producing two breakdown rows.

Before marking this task complete:

1. Deploy to stage (`aio rt action update` if `aio app deploy` skips the action — see memory note `feedback_aio_deploy_cache_bypass.md`).
2. Place a test order with a US/CA address and a multi-item cart.
3. In the Commerce admin, inspect the order's tax breakdown — confirm TWO rows per item ("Tax" and the rule name).
4. If only ONE row appears (the second `add` overwrote the first), change the path to `tax_breakdown/-` (RFC 6902 array-append) for the second op, or use indexed paths `tax_breakdown/0` and `tax_breakdown/1` for both ops. Re-deploy and re-verify.

Document the verified path syntax in the file header comment so future maintainers do not have to re-discover it.

### `tax.amount` vs `tax.rate` Consistency

The combined `tax.amount` (flat tax + fee portion) is no longer equal to `tax.rate × lineSubtotal / 100`. Magento may either tolerate this or recompute and override `amount` from `rate`. To minimize risk:

- Keep `rate` as `taxRatePercent` (the actual tax rate).
- Set `amount` to the combined value.
- Verify in stage that the order total matches `subtotal + amount`. If Magento overrides, switch to setting `rate` to an effective rate (`(combinedAmount / lineSubtotal) * 100`) instead, and document the choice.

### Discount and `is_tax_included` Handling

The fee distribution uses `lineSubtotal = unit_price × quantity`, ignoring `item.discount_amount` and `item.is_tax_included`. This matches the existing flat-tax computation behavior — do NOT introduce new logic that diverges. If a future task needs discount-aware fee allocation it must update both the tax and fee paths together.

### Fee Distribution Algorithm

**Total fee calculation:**

- `fixed` rule: `totalFee = rule.value`
- `percentage` rule: `totalFee = round2(totalSubtotal × rule.value / 100)`

**Proportional distribution across items:**

```
lineSubtotal[i] = round2(item.unit_price × item.quantity)
totalSubtotal   = Σ lineSubtotal[i]
feePortion[i]   = round2(totalFee × lineSubtotal[i] / totalSubtotal)
```

Apply remainder to the LAST item to guarantee the portions sum exactly to `totalFee`:

```
feePortion[last] += round2(totalFee - Σ feePortion[i])
```

**Edge cases:**

- Single item: all fee goes to that item (no distribution needed)
- `totalSubtotal === 0`: assign entire fee to first item (zero-price cart edge case)
- `rule === null` or `totalFee === 0`: return existing single-breakdown behavior

### Per-Item Output (with fee)

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
    "instance": "Magento\\...OopQuoteItemTaxBreakdownInterface"
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
    "instance": "Magento\\...OopQuoteItemTaxBreakdownInterface"
  },

  {
    "op": "replace",
    "path": "oopQuote/items/0/tax",
    "value": {
      "data": { "rate": 10, "amount": 13.49, "discount_compensation_amount": 0 }
    },
    "instance": "Magento\\...OopQuoteItemTaxInterface"
  }
]
```

`tax.amount` = flat tax amount + fee portion.

## Requirements (Test Descriptions)

- [ ] `it returns single tax_breakdown and tax ops per item when rule is null`
- [ ] `it returns two tax_breakdown ops per item when a fixed fee rule matches`
- [ ] `it returns two tax_breakdown ops per item when a percentage fee rule matches`
- [ ] `it sets delivery-fee tax_breakdown amount proportional to each item line subtotal for fixed rules`
- [ ] `it sets delivery-fee tax_breakdown amount as percentage of each item line subtotal for percentage rules`
- [ ] `it assigns remainder to the last item so fee portions sum exactly to the total fee`
- [ ] `it includes both flat tax and fee portion in the replace tax amount`
- [ ] `it assigns entire fee to the first item when total subtotal is zero`
- [ ] `it uses rule.name as the title for the delivery-fee tax_breakdown`
- [ ] `it uses "delivery-fee" as the code and tax_rate_key for the fee breakdown entry`
- [ ] `it rounds fee portions to 2 decimal places`
- [ ] `it rounds the combined tax amount (flat tax + fee) to 2 decimal places`
- [ ] `it (in index.js) passes the rule returned by sendData into transformData as the second argument`
- [ ] `it (in index.js) returns 200 with two-breakdown ops when sender returns a rule and items match`
- [ ] `it (in index.js) returns 200 with single-breakdown ops when sender returns null`

## Acceptance Criteria

- All requirements have passing tests
- `transformData(normalized, null)` output is byte-for-byte identical to the old `transformData(normalized)` output
- `index.js` updated to capture `sendData` result: `const rule = await sendData(normalized);` then pass `rule` into `transformData(normalized, rule)` — this MUST be in the same PR/task because the existing tests will otherwise see a behavior change without coverage
- The pre-existing test at `test/actions/tax/collect-taxes/collect-taxes.test.js` line 284-290 ("it sender returns the expected no-op shape") MUST be updated or removed in this task because `sendData` no longer always returns null — describe the new contract: `sendData({})` returns null only when country is absent
- The deployed `tax_breakdown` path syntax has been verified against a real Commerce stage order (two breakdown rows visible)
- No changes to adjustment-taxes transformer (only `collect-taxes/transformer.js`)
- Code passes `npm run code:lint:fix && npm run code:format:fix`
