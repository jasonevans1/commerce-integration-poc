# Task 002: Update `collect-taxes/sender.js` — Look Up Delivery Fee Rule

**Status**: pending
**Depends on**: [001]
**Retry count**: 0

## Description

Update `actions/tax/collect-taxes/sender.js` from a no-op to a function that looks up the delivery fee rule from I/O State using the existing `getRule` function from `actions/delivery-fee/lib/state-service.js`. Returns the rule object (or `null` when no rule matches, `country` is null, or the state lookup throws). The webhook is on the synchronous checkout critical path (`required="true"`), so any state-lookup failure MUST be swallowed and translated to `null` so checkout proceeds with tax-only behavior. Failing closed would block all checkouts during an I/O State outage.

## Context

- **Repo**: `/Users/jevans03/projects/commerce-integration-poc`
- **File**: `actions/tax/collect-taxes/sender.js`
- **Import**: `const { getRule } = require('../../delivery-fee/lib/state-service');`
  - This is a relative cross-package import. Webpack bundles it with the action. No new shared lib needed.
  - `state-service.js` depends on `@adobe/aio-lib-state` (already in repo `package.json` from delivery-fee). Webpack will bundle it into the `collect-taxes` action zip — verify bundle size is acceptable post-deploy.
  - Adobe I/O Runtime auto-injects `__OW_API_KEY` and `__OW_NAMESPACE` for state access. The `tax` package shares the workspace namespace with `delivery-fee`, so state keys written by `delivery-fee` (e.g. `rule.US.CA`) are reachable from `tax` actions.
- **`getRule(country, region)`**: returns `{ country, region, name, type, value }` or `null` if not found. Throws on auth/network failure.
- **Input from pre**: `normalized.country` (string or null), `normalized.region` (string)
- If `country` is null/empty, skip the lookup and return `null` immediately — no state call needed
- If `getRule` throws, log the error (use `aio-lib-core-logging` or `console.error`) and return `null`. Do NOT re-throw — checkout must not be blocked by a fee lookup failure.
- The `@adobe/aio-lib-state` client is already initialized inside `state-service.js`. Note: `stateLib.init()` is called per `getRule` call (no caching). Acceptable for POC; flag for follow-up optimization.

## Requirements (Test Descriptions)

- [ ] `it calls getRule with the uppercased country and region from normalized params`
- [ ] `it returns the rule object when a matching rule exists in state`
- [ ] `it returns null when no rule exists for the country and region`
- [ ] `it returns null without calling getRule when country is null`
- [ ] `it returns null without calling getRule when country is empty string`
- [ ] `it returns null when getRule throws (state outage must not block checkout)`

## Acceptance Criteria

- All requirements have passing tests
- `sendData` is now `async` (it was previously synchronous no-op)
- Returns `rule` (object or null) — passed to transformer as second argument
- `getRule` is mocked in tests via `jest.mock('../../delivery-fee/lib/state-service')`
- Code passes `npm run code:lint:fix && npm run code:format:fix`

## Implementation Notes

```js
const { getRule } = require("../../delivery-fee/lib/state-service");

async function sendData(normalized) {
  const { country, region } = normalized;
  if (!country) return null;
  try {
    return await getRule(country, region);
  } catch (error) {
    // Fail open — never block checkout because of a fee-rule lookup failure.
    console.error(
      "collect-taxes: getRule failed, proceeding with tax-only",
      error,
    );
    return null;
  }
}

module.exports = { sendData };
```
