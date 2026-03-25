# Task 003: Create Company Commerce Consumer

**Status**: completed
**Depends on**: [001, 002]
**Retry count**: 0

## Description

Create the event consumer at `actions/company/commerce/consumer/index.js`. It receives `observer.company_save_commit_after` events from Adobe I/O Events, applies idempotency checking via `@adobe/aio-lib-state`, determines whether the save is a new registration using the `_isNew` boolean from the event payload, and invokes the `company-commerce/created` action via Openwhisk.

## Context

- Related files (patterns to follow):
  - `actions/customer/commerce/consumer/index.js` — full pattern including idempotency, Openwhisk invocation, switch/case routing
  - `actions/company/commerce/metrics.js` — metrics to import (from task 001)
  - `actions/company/commerce/created/index.js` — action being invoked (from task 002)
- Files to create: `actions/company/commerce/consumer/index.js`
- Uses `@adobe/aio-lib-state` for idempotency (TTL 300s, key: `processed-event-${eventId}`)
- Uses `@adobe/aio-lib-telemetry` for `instrumentEntrypoint`, `getInstrumentationHelpers` -- the `contextCarrier` from `getInstrumentationHelpers()` must be passed to invoked actions as `__telemetryContext`
- Uses `../../../telemetry` for `telemetryConfig`
- Uses `../../../openwhisk` Openwhisk client for action invocation (constructor takes `params.API_HOST`, `params.API_AUTH`)
- Uses `../../../utils` for `checkMissingRequestInputs(params, ["type"], [])` and `stringParameters` -- follow the same validation pattern as the customer consumer
- Uses `../../../responses` for `errorResponse`, `successResponse`, and `isConsumerSuccessful`
- Uses `../../../constants` for `HTTP_BAD_REQUEST`, `HTTP_OK`, `HTTP_INTERNAL_ERROR`
- Action name to invoke: `"company-commerce/created"`
- Event type to handle: `` `com.adobe.commerce.${params.EVENT_PREFIX}.observer.company_save_commit_after` ``

## New vs Update Detection Logic

The event payload includes a `_isNew` boolean (confirmed from Adobe Commerce B2B documentation). Use it directly — no date comparison needed.

```js
const data = params.data.value;

if (data._isNew === true) {
  // invoke company-commerce/created, spreading data and passing telemetry context:
  // openwhiskClient.invokeAction("company-commerce/created", { ...data, __telemetryContext: contextCarrier })
} else {
  // log "Company update event, skipping notification" and return successResponse
}
```

> **Schema confirmed**: `_isNew` is an explicit boolean in the `observer.company_save_commit_after` payload. No fallback date logic needed.

## Requirements (Test Descriptions)

- [ ] `it returns 400 when params.type is missing`
- [ ] `it returns 400 when the event type is not supported`
- [ ] `it skips processing and returns success when event_id was already processed`
- [ ] `it marks event_id as processed in state with TTL 300 after first processing`
- [ ] `it invokes company-commerce/created when _isNew is true`
- [ ] `it skips created invocation and returns success when _isNew is false`
- [ ] `it skips created invocation and returns success when _isNew is absent`
- [ ] `it returns success response when created action invocation succeeds`
- [ ] `it returns error response when created action invocation returns failure`
- [ ] `it increments consumerTotalCounter on every invocation`
- [ ] `it increments consumerSuccessCounter on successful processing`

## Acceptance Criteria

- All requirements have passing tests
- Consumer correctly handles only `observer.company_save_commit_after` event type
- Idempotency matches the pattern in `customer/commerce/consumer/index.js`
- No copyright headers added
