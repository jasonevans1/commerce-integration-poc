# Task 003: Implement collect-adjustment-taxes Webhook Action (TDD: tests + implementation)

**Status**: completed
**Depends on**: [002]
**Retry count**: 0

## Description

Implement the `collect-adjustment-taxes` synchronous webhook action under `actions/tax/collect-adjustment-taxes/`, plus its full unit test suite. This is a TDD task: tests and implementation in one cycle.

This action handles tax adjustments (e.g., after order cancellation or partial refund). For the flat-rate testing use case, this action returns a pass-through / zero-adjustment response. APPEND the `collect-adjustment-taxes` entry to the existing `actions/tax/actions.config.yaml` created in task 002 — preserve the `collect-taxes` entry verbatim.

## Context

- **Source**: Fetch the actual implementation from the checkout starter kit repo:
  - Look for `actions/tax/collect-adjustment-taxes/` on GitHub in the starter kit
  - Use the starter kit's structure as the base implementation
  - If upstream cannot be fetched, invoke the `search-commerce-docs` MCP tool to find the official adjustment tax response schema
- **Reference**: `actions/tax/collect-taxes/` (created in task 002) — same 6-file structure
- **Reference test**: `test/actions/tax/collect-taxes/collect-taxes.test.js` (created in task 002) — mirror the structure
- **Test file location**: `test/actions/tax/collect-adjustment-taxes/collect-adjustment-taxes.test.js`
- **Handler files to create** (all under `actions/tax/collect-adjustment-taxes/`):
  - `index.js` — orchestrates pipeline, exports `main`
  - `validator.js` — validates payload AND verifies webhook signature using `COMMERCE_WEBHOOKS_PUBLIC_KEY` (same pattern as task 002), exports `validateData`
  - `pre.js` — normalizes payload, exports `preProcess`
  - `transformer.js` — for flat rate, returns zero adjustment; exports `transformData`
  - `sender.js` — no-op for flat rate, exports `sendData`
  - `post.js` — builds adjustment response, exports `postProcess`
- **Update** `actions/tax/actions.config.yaml` — APPEND the `collect-adjustment-taxes` entry alongside the existing `collect-taxes` entry. Use the same `final: false`, `require-adobe-auth: false`, and inject `TAX_RATE_PERCENT` and `COMMERCE_WEBHOOKS_PUBLIC_KEY` as inputs:
  ```yaml
  collect-adjustment-taxes:
    function: collect-adjustment-taxes/index.js
    web: "yes"
    runtime: nodejs:22
    inputs:
      LOG_LEVEL: debug
      TAX_RATE_PERCENT: $TAX_RATE_PERCENT
      COMMERCE_WEBHOOKS_PUBLIC_KEY: $COMMERCE_WEBHOOKS_PUBLIC_KEY
    annotations:
      require-adobe-auth: false
      final: false
  ```
  CRITICAL: Read the existing file first, then APPEND — do not overwrite. Verify the `collect-taxes` entry remains intact after this task.
- **Webhook method**: Commerce dispatches this during order adjustment scenarios
- **Auth**: Same as collect-taxes — `require-adobe-auth: false`, `final: false`
- **Response Contract**: Return the adjustment tax response as expected by Commerce's OOP tax module — fetch from starter kit source for exact format. For flat-rate POC, this is typically a zero-adjustment response (e.g., `{ taxes: [] }` or equivalent). Document the chosen shape in Implementation Notes.
- **Signature verification**: Same skip-if-key-absent pattern as task 002. May import a shared helper if one is created in task 002 (e.g., `actions/tax/lib/verify-signature.js`).

## Requirements (Test Descriptions)

### Scaffold tests

- [ ] `it appends collect-adjustment-taxes entry to actions/tax/actions.config.yaml with web yes, require-adobe-auth false, and final false`
- [ ] `it preserves the existing collect-taxes entry in actions.config.yaml unchanged`
- [ ] `it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-adjustment-taxes config entry`
- [ ] `it creates all six handler files in actions/tax/collect-adjustment-taxes/`
- [ ] `it exports main from index.js`
- [ ] `it exports validateData from validator.js`
- [ ] `it exports preProcess from pre.js`
- [ ] `it exports transformData from transformer.js`
- [ ] `it exports sendData from sender.js`
- [ ] `it exports postProcess from post.js`

### Behavior tests

- [ ] `it returns 200 with valid adjustment tax response for a valid payload`
- [ ] `it returns zero-adjustment response for the flat-rate use case`
- [ ] `it returns 400 when required payload fields are missing`
- [ ] `it returns 500 on unexpected internal errors`
- [ ] `it sender returns the expected no-op shape`
- [ ] `it preProcess extracts the expected fields from the raw payload`

### Signature verification tests

- [ ] `it skips signature verification when COMMERCE_WEBHOOKS_PUBLIC_KEY is not set`
- [ ] `it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is invalid`
- [ ] `it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid`

## Acceptance Criteria

- All requirements have passing tests
- All 6 handler files present in `actions/tax/collect-adjustment-taxes/`
- `actions/tax/actions.config.yaml` updated to include `collect-adjustment-taxes` AND `collect-taxes` (both entries present, neither overwritten)
- `final: false`, `require-adobe-auth: false` on annotations
- Signature verification implemented (or shared helper used)
- Named constants for all numeric literals in tests
- Mocking: only mock external I/O
- Code passes Biome lint

## Implementation Notes

(Left blank — filled in by programmer during implementation. MUST document the final response contract shape used.)
