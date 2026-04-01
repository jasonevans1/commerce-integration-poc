# Devil's Advocate Review: delivery-fee-api

## Critical (Must fix before building)

### C1: State key format uses illegal colon characters (Tasks 002, 003, 004, 005, 006, 007, \_plan)

The plan specifies state keys as `rule:{COUNTRY}:{REGION}` (e.g., `rule:US:CA`). However, `@adobe/aio-lib-state` v5.1.0 validates keys against the pattern `^[a-zA-Z0-9-_.]{1,N}$` (see `node_modules/@adobe/aio-lib-state/lib/constants.js` line 50). **Colons are not permitted.** Every `get()`, `put()`, and `delete()` call will throw `ERROR_BAD_ARGUMENT` at runtime.

**Fix:** Change key format to `rule.{COUNTRY}.{REGION}` (e.g., `rule.US.CA`). Periods are allowed.

### C2: State `list()` returns only keys, not values (Tasks 002, 007)

Task 002 says `listRules()` should "return array of rule objects" and references `list({ match })` returning an async iterator. However, the actual `aio-lib-state` v5 `list()` method yields `{ keys: string[] }` -- it returns **key names only**, not key-value pairs. To get the actual rule data, `listRules()` must iterate the keys and call `get()` for each one.

**Fix:** Update task 002 to document that `listRules()` must: (1) call `list({ match: 'rule.*' })` to get keys, (2) call `get()` for each key, (3) parse and return the values. Update task 007 sender to note it delegates this complexity to the state service.

### C3: State values must be strings -- JSON serialization required (Task 002)

`aio-lib-state` v5 `put(key, value)` validates that `value` is of type `string` (see `AdobeState.js` line 341). `get()` returns `{ value: string, expiration: string }`, not the raw value. The plan does not mention JSON serialization/deserialization anywhere.

**Fix:** Update task 002 to require `JSON.stringify()` on write and `JSON.parse(result.value)` on read. Also note that `get()` returns `{ value, expiration }` or `undefined` (not `null`) when key is missing.

### C4: Default TTL is 24 hours -- rules will silently expire (Tasks 002, \_plan)

The plan says "do not set TTL -- rules should persist indefinitely until explicitly deleted." However, `aio-lib-state` v5 defaults to 24 hours when TTL is omitted or set to 0. There is NO infinite TTL option; the maximum is 1 year (31536000 seconds). Rules will vanish after 24 hours.

**Fix:** Update task 002 to set `{ ttl: 31536000 }` (max 1 year) on every `put()` call. Add a note in \_plan.md risks section about the TTL ceiling and the need for a refresh strategy for long-lived rules.

## Important (Should fix before building)

### I1: Handler orchestration order differs from starter kit pattern (Task 003)

Task 003 specifies the flow as `validator -> pre -> sender -> transformer -> post`. The existing starter kit pattern in `actions/order/commerce/created/index.js` is `validator -> transformer -> pre -> sender -> post`. This is a deliberate and sensible deviation for the calculate action (pre normalizes input, sender fetches state, transformer computes fee). However, the task says "Patterns to follow: existing 6-file handlers in `actions/order/commerce/created/`" which will confuse a worker into using the wrong order.

**Fix:** Add an explicit note to task 003 (and tasks 004-007) that the orchestration order deliberately differs from the starter kit event handlers, and document the exact order in each task.

### I2: Task 002 should not depend on Task 001 (Task 002)

Task 002 (state service module) is a pure JavaScript module at `actions/delivery-fee/lib/state-service.js`. It has zero dependency on the YAML configuration files created in task 001. Making it depend on 001 prevents parallel execution of the first two tasks.

**Fix:** Remove the dependency of task 002 on task 001. Tasks 001 and 002 can run in parallel. Tasks 003-007 depend on both 001 and 002.

### I3: Actions 003-007 need dependency on Task 001 as well (Tasks 003-007)

Tasks 003-007 only list task 002 as a dependency. But they also need the `actions.config.yaml` from task 001 to be in place, because the acceptance criteria state "Action is registered in `actions/delivery-fee/actions.config.yaml`." If a worker building task 003 arrives before task 001 is done, they cannot verify config registration.

**Fix:** Update tasks 003-007 to depend on both [001, 002].

### I4: `get()` returns `undefined` not `null` for missing keys (Tasks 002, 003, 005)

The plan says `getRule` "returns null when rule does not exist." However, `aio-lib-state` `get()` returns `undefined` (no return statement for 404 response in `AdobeState.js` line 312-318). The state service should normalize this to `null`, and the test descriptions should verify the wrapper handles the `undefined` -> `null` conversion.

**Fix:** Add a note to task 002 that `get()` returns `undefined` for missing keys and the wrapper must normalize to `null`.

### I5: Response format differs from project conventions (Tasks 003-007)

The existing project uses `actionSuccessResponse(message)` which returns `{ statusCode: 200, body: { success: true, message } }` and `actionErrorResponse(statusCode, error)` which returns `{ statusCode, body: { success: false, error } }` (see `actions/responses.js`). The plan's calculate action returns `{ fee, name, currency }` directly, and the CRUD actions return custom shapes like `{ success: true, rule: {...} }`. This is fine for a public API with a different contract, but workers might try to reuse the existing response helpers and get the wrong shape.

**Fix:** Add a note to tasks 003-007 that they should NOT use the existing `actionSuccessResponse`/`actionErrorResponse` helpers since the response shape differs. They should construct response objects directly as `{ statusCode: 200, body: { ... } }`.

### I6: No error handling for state service failures documented (Tasks 003-007)

None of the action tasks mention what happens if `aio-lib-state` throws (network error, auth failure, rate limit). The existing `index.js` pattern has a try-catch returning `HTTP_INTERNAL_ERROR`, but this needs to be explicit in the plan since workers are building a new pattern.

**Fix:** Add to each action task (003-007) that `index.js` must wrap the handler pipeline in try-catch and return `{ statusCode: 500, body: { error: "Internal server error" } }` on unexpected failures.

### I7: `list()` match pattern and N+1 query risk (Tasks 002, 007)

After fixing C1 (key format to `rule.COUNTRY.REGION`), the `listRules()` match pattern needs to be `rule.*`. Combined with C2 (list returns only keys), this means listing N rules requires 1 list call + N get calls. For a small rule set this is fine, but it should be documented as a known limitation.

**Fix:** Add the match pattern `rule.*` explicitly to task 002. Add a note about the N+1 pattern being acceptable for the expected small rule set (tens, not thousands).

## Minor (Nice to address)

### M1: No input length/size validation

The plan does not limit the length of `country`, `region`, or `name` fields. A malicious caller could send a very long string. Since state keys have a max size and values have a max size, this would eventually fail at the state layer, but with an unhelpful error message.

### M2: Currency field is not validated

The `calculate` action accepts any string as `currency` and passes it through. No ISO 4217 validation is performed. This is probably fine for Phase 1 but could cause issues downstream.

### M3: No rate limiting on public calculate endpoint

The `calculate` action is public (`require-adobe-auth: false`). There is no rate limiting mentioned. OpenWhisk has its own concurrency limits, but this should be documented as a risk.

### M4: `list()` method is not `async` -- it returns an async generator

Task 002 says "list() (returns async iterator)" which is accurate. But the method itself is synchronous (returns the generator object). Workers should not `await state.list()` -- they should use `for await...of`.

## Questions for the Team

### Q1: What happens when rules expire after 1 year?

Even with the max TTL of 31536000 seconds, rules will expire after exactly 1 year. Is there a plan for a renewal job, or is this acceptable for Phase 1? A scheduled action could refresh TTLs periodically.

### Q2: Should `calculate` support batch requests?

The current design handles one address at a time. If EDS needs to calculate fees for multiple shipping options, this could result in many sequential API calls.

### Q3: Should rule names be unique?

Nothing prevents two rules from having the same `name` with different country/region combinations. Is this intentional?
