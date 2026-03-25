# Task 001: Create Company Commerce Metrics

**Status**: complete
**Depends on**: none
**Retry count**: 0

## Description

Create the OpenTelemetry metrics definition file for the company commerce package. This mirrors the existing `actions/customer/commerce/metrics.js` pattern and provides counters used by the consumer.

## Context

- Related files:
  - `actions/customer/commerce/metrics.js` — pattern to follow exactly
  - `actions/company/commerce/metrics.js` — file to create (directory does not exist yet; create it)
- The metrics module uses `@adobe/aio-lib-telemetry`'s `defineMetrics` helper
- Metric names follow the pattern `{entity}.commerce.consumer.{type}_count`

## Requirements (Test Descriptions)

- [x] `it exports commerceCompanyMetrics with consumerSuccessCounter`
- [x] `it exports commerceCompanyMetrics with consumerTotalCounter`
- [x] `it defines consumerSuccessCounter with correct metric name "company.commerce.consumer.success_count"`
- [x] `it defines consumerTotalCounter with correct metric name "company.commerce.consumer.total_count"`

## Acceptance Criteria

- All requirements have passing tests
- Test file located at `test/actions/company/commerce/metrics.test.js`
- Implementation file located at `actions/company/commerce/metrics.js`
- Follows the same structure as `actions/customer/commerce/metrics.js`
- No copyright headers added

## Implementation Notes

- Created `actions/company/commerce/metrics.js` mirroring `actions/customer/commerce/metrics.js` exactly, substituting "company" for "customer" in export name, metric names, and descriptions.
- Created `test/actions/company/commerce/metrics.test.js` with Jest mocks for `@adobe/aio-lib-telemetry` and `@adobe/aio-lib-telemetry/otel`. The `defineMetrics` mock passes through the factory function so tests can call it with a mock meter directly.
- All 4 tests pass. Both files pass Biome lint with no errors.
