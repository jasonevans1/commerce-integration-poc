---
name: 001-fee-id-format
description: Update customFees fee id values to use extensionId::feeName format per Admin UI SDK docs
type: project
---

# Task 001: Update customFees Fee ID Format

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

The Admin UI SDK docs recommend that `customFees` `id` values use the format `<extensionId>::<feeName>`. The current implementation uses `delivery-fee-us-ca` format. Update the registration action to produce IDs like `delivery-fee-rules::us-ca` and update all tests accordingly.

## Context

- **File to modify**: `src/commerce-backend-ui-1/actions/registration/index.js`
- **Test file to modify**: `test/actions/commerce-backend-ui-1/registration.test.js`
- **Extension manifest ID**: `delivery-fee-rules` (from `extension-manifest.json`)
- **Current ID format**: `` `delivery-fee-${rule.country.toLowerCase()}-${rule.region.toLowerCase()}` ``
- **New ID format**: `` `delivery-fee-rules::${rule.country.toLowerCase()}-${rule.region.toLowerCase()}` ``
- Example: `delivery-fee-us-ca` → `delivery-fee-rules::us-ca`
- The `massActions` entry in the same response (`actionId: "hello-world"`) is NOT affected — leave it unchanged
- Existing `label` and `value` mappings are unchanged

### Test assertions that reference the old fee ID (both must be updated)

1. **`"constructs the fee id as delivery-fee-{country}-{region} in lowercase"`** (line 55) — asserts `toBe("delivery-fee-us-ca")`. Rename this test description to `"constructs the fee id as delivery-fee-rules::us-ca format"` and update the expected value.
2. **`"still returns order.customFees alongside the new massActions"`** (line 135) — asserts `toBe("delivery-fee-us-ca")` at line 151. Update the expected value only (test description is fine as-is).

## Requirements (Test Descriptions)

- [ ] Rename existing test: `it constructs the fee id as delivery-fee-rules::us-ca format` (was `"constructs the fee id as delivery-fee-{country}-{region} in lowercase"`)
- [ ] Update assertion in existing test: `"still returns order.customFees alongside the new massActions"` to expect `"delivery-fee-rules::us-ca"` instead of `"delivery-fee-us-ca"`
- [ ] `it includes the extension id prefix delivery-fee-rules in every fee id` (new test)

## Acceptance Criteria

- Registration action produces fee IDs matching `delivery-fee-rules::{country}-{region}` pattern
- Existing tests for `label`, `value`, empty state, error state remain passing (update `id` assertions only)
- `massActions` entry unchanged
- Code passes lint and format checks

## Implementation Notes

(Left blank — filled in by programmer during implementation)
