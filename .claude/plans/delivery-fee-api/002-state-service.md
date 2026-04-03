# Task 002: Shared State Service Module

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create a shared `state-service.js` module at `actions/delivery-fee/lib/state-service.js` that wraps `@adobe/aio-lib-state` and provides typed methods for reading and writing delivery fee rules.

## Context

- Related files: `actions/delivery-fee/lib/state-service.js` (new)
- `@adobe/aio-lib-state` v5.1.0 is already in `package.json` dependencies
- Key format: `rule.{COUNTRY}.{REGION}` where country and region are uppercased (e.g., `rule.US.CA`) -- colons are NOT allowed in `aio-lib-state` v5 keys; only `[a-zA-Z0-9-_.]`
- Rule schema: `{ country: string, region: string, name: string, type: "fixed"|"percentage", value: number }`
- **State TTL:** `aio-lib-state` v5 defaults to 24 hours if TTL is omitted. There is no infinite TTL. Use `{ ttl: 31536000 }` (max 1 year) on every `put()` call.
- **Value serialization:** `aio-lib-state` v5 only stores string values. Use `JSON.stringify()` on write and `JSON.parse()` on read.
- **`get()` return type:** Returns `{ value: string, expiration: string }` when key exists, or `undefined` (not `null`) when key is missing. The wrapper must normalize `undefined` to `null`.
- **`list()` returns keys only:** The `list({ match })` method yields `{ keys: string[] }` batches via an async generator -- NOT key-value pairs. To get rule objects, `listRules()` must: (1) iterate keys from `list({ match: 'rule.*' })`, (2) call `get()` for each key, (3) parse and return the values. This N+1 pattern is acceptable for the expected small rule set.
- **`list()` is not async:** It returns an async generator synchronously. Use `for await...of` to iterate, do NOT `await state.list()`.
- All methods must initialize the state client via `init()` before use

## Requirements (Test Descriptions)

- [x] `it builds state key as rule.COUNTRY.REGION in uppercase using only valid aio-lib-state characters`
- [x] `it returns null when rule does not exist in state`
- [x] `it returns rule object when rule exists in state`
- [x] `it stores rule in state with correct key format`
- [x] `it deletes rule from state by country and region`
- [x] `it returns empty array when no rules exist`
- [x] `it lists all rules matching the rule.* prefix pattern`
- [x] `it fetches each key returned by list() and returns parsed rule objects`
- [x] `it returns array of rule objects from list`
- [x] `it serializes rule as JSON string when storing via put()`
- [x] `it deserializes JSON string from get() result.value into rule object`
- [x] `it stores rules with ttl of 31536000 (max 1 year)`
- [x] `it returns null (not undefined) when get() returns undefined for missing key`

## Acceptance Criteria

- All requirements have passing tests
- Module exports: `getRule(country, region)`, `putRule(rule)`, `deleteRule(country, region)`, `listRules()`
- No hardcoded credentials or state initialization params beyond what `init()` auto-resolves from env

## Implementation Notes

- Implemented `actions/delivery-fee/lib/state-service.js` with four exported functions: `getRule`, `putRule`, `deleteRule`, `listRules`.
- Key format uses `rule.{COUNTRY}.{REGION}` with `.toUpperCase()` on both country and region.
- TTL constant `STATE_TTL = 31_536_000` passed on every `put()` call.
- `get()` returns `null` (not `undefined`) when the key is missing by checking `result === undefined`.
- `listRules()` uses `for await...of` directly on `state.list({ match: "rule.*" })` (no `await` on `list()`), iterates `batch.keys`, then calls `get()` per key.
- JSON.stringify on write, JSON.parse on read via `result.value`.
- `@adobe/aio-lib-state` mocked in tests via `jest.mock()` with `init` returning an object with `get`, `put`, `delete`, `list` mock functions.
- All 13 tests pass; 402 total passing.
