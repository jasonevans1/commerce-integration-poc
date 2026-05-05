# Task 004: Update `collect-taxes/validator.js` — Graceful Handling of Missing `ship_to_address`

**Status**: pending
**Depends on**: none
**Retry count**: 0

## Description

Update `actions/tax/collect-taxes/validator.js` to handle the case where `oopQuote.ship_to_address` is absent. This is not an error — tax can still be collected without a fee (e.g., virtual/downloadable products, or early cart state). The validator must continue to pass in this case; `pre.js` will return `country: null` and the sender will skip the state lookup.

The validator already accepts the call when `oopQuote.items` is present. No new error path is introduced — this task ensures validator tests explicitly cover the ship_to_address-absent case and that existing tests still pass.

## Context

- **Repo**: `/Users/jevans03/projects/commerce-integration-poc`
- **File**: `actions/tax/collect-taxes/validator.js`
- **Current behavior**: validates `oopQuote` exists and `oopQuote.items` exists. Nothing about ship_to_address.
- **Required behavior**: same as current — `ship_to_address` is optional. The validator does NOT require it.
- This task is primarily a test coverage task. The validator code itself may not need to change — just verify and document that ship_to_address absence is intentionally allowed.

## Requirements (Test Descriptions)

- [ ] `it returns success true when oopQuote has items but no ship_to_address`
- [ ] `it returns success true when oopQuote has items and a complete ship_to_address`
- [ ] `it returns success true when ship_to_address is present but country is missing`
- [ ] `it returns success false when oopQuote is missing`
- [ ] `it returns success false when oopQuote.items is missing`

## Acceptance Criteria

- All requirements have passing tests (added to `test/actions/tax/collect-taxes/collect-taxes.test.js` in this task — task 005 covers main()-level integration only and must NOT duplicate validator-only assertions)
- Validator does NOT return `success: false` when `ship_to_address` is missing
- Existing validator tests still pass
- Code passes `npm run code:lint:fix && npm run code:format:fix`

## Implementation Notes

The validator code likely does not need to change. The work here is:

1. Read the current `validateData` function
2. Confirm `ship_to_address` absence does not cause a failure path
3. Add the three new test cases to the existing test file (in task 005) to confirm

If the validator does need a code change (e.g., it currently throws on unknown fields), make the minimal fix.
