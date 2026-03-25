# Devil's Advocate Review: company-registration-notification

## Critical (Must fix before building)

### C1. `trimEnd("/")` does not strip trailing slashes (tasks 002, \_plan.md)

`String.prototype.trimEnd()` does NOT accept a character argument -- it only removes trailing whitespace. The code `(params.COMMERCE_BASE_URL || "").trimEnd("/")` will silently leave trailing slashes intact, producing URLs like `https://example.com//admin/company/...`.

**Fix:** Replace with `.replace(/\/+$/, "")` in task 002 sender data flow and in `_plan.md` Risks section.

### C2. Missing `__telemetryContext` propagation in consumer invocation (task 003)

The existing customer consumer passes `__telemetryContext: contextCarrier` when invoking the created action via Openwhisk (see `actions/customer/commerce/consumer/index.js` line 112). Task 003 does not mention this. Without it, telemetry spans will be disconnected between the consumer and handler.

**Fix:** Add `__telemetryContext` to the consumer invocation specification in task 003.

### C3. Consumer test mocking pattern mismatch (task 005)

Task 005 says to mock `../../../openwhisk` (the local Openwhisk wrapper class). But the actual consumer test pattern (`test/actions/customer/commerce/consumer/consumer.test.js`) uses `jest.mock("openwhisk")` -- mocking the underlying `openwhisk` npm package, not the local wrapper. A worker following task 005's instructions will produce tests that don't match the codebase pattern and may not work correctly.

**Fix:** Update task 005 to specify `jest.mock("openwhisk")` and `const openwhisk = require("openwhisk")` pattern, matching the existing consumer test.

## Important (Should fix before building)

### I1. Missing `checkMissingRequestInputs` utility reference in consumer (task 003)

The existing customer consumer uses `checkMissingRequestInputs(params, ["type"], [])` from `../../../utils` for input validation. Task 003 says "returns 400 when params.type is missing" but does not reference this utility or the `utils` import. A worker might implement their own validation logic instead of using the established pattern.

**Fix:** Add `../../../utils` (specifically `checkMissingRequestInputs` and `stringParameters`) to the context/imports list in task 003.

### I2. Missing `responses` imports in consumer context (task 003)

The consumer needs `errorResponse`, `successResponse`, and `isConsumerSuccessful` from `../../../responses`. Task 003 mentions none of these. A worker will need to discover these on their own by reading the customer consumer.

**Fix:** Add `../../../responses` to the context/imports list in task 003.

### I3. Task 005 omits metrics tests defined in task 001 (tasks 001, 005)

Task 001 defines 4 test requirements for `metrics.js`. Task 005 is supposed to be the comprehensive test task but only covers tasks 002 and 003. The metrics tests are orphaned -- task 001 defines them, but since task 001 is a "metrics" task (not a "test" task), a TDD worker on task 001 should write both the implementation and the tests. However, there's no test file path specified in task 001.

**Fix:** Add test file path `test/actions/company/commerce/metrics.test.js` to task 001 so the worker knows where to put the tests.

### I4. Consumer `EVENT_PREFIX` not in events.json key (task 004 -- informational, no fix needed)

The events.json sample uses `com.adobe.commerce.observer.company_save_commit_after` (no EVENT_PREFIX). This matches the existing pattern (customer events also omit EVENT_PREFIX in events.json). The consumer constructs the full key at runtime. No fix needed, but flagging for awareness.

### I5. Consumer needs `constants` import (task 003)

The consumer uses `HTTP_BAD_REQUEST`, `HTTP_OK`, and `HTTP_INTERNAL_ERROR` from `../../../constants` but this import is not listed in task 003's context.

**Fix:** Add `../../../constants` to the context/imports list in task 003.

### I6. Task 005 should depend on task 001 (task 005)

Task 005 depends on [002, 003] but not [001]. If a test worker needs to test metrics (or if the metrics module must exist for the consumer tests to pass since the consumer imports it), task 005 needs task 001 complete.

**Fix:** Add 001 to task 005's dependencies.

## Minor (Nice to address)

### M1. `customerName` field uses email address, not actual name

The transformer maps `data.customer_email || data.email` to `customerName`. This means the email body will read "submitted by customer john.doe@example.com" rather than an actual name. If the B2B company event payload includes fields like `customer_firstname`/`customer_lastname`, those would be preferable. This is a product decision, not a code bug.

### M2. No `pre.js` or `post.js` test coverage in task 005

Task 005 does not include tests for `pre.js` or `post.js`. While these are thin logging wrappers, the existing test patterns in the codebase also skip them. Consistent with the codebase, but worth noting.

### M3. Task 004 requirements are not TDD-testable

Task 004's "requirements" are configuration file edits (YAML, JSON). The test descriptions (`it includes company-commerce package in app.config.yaml`) are not standard unit tests -- they're manual verification checks. A TDD worker may struggle with how to express these as automated tests.

### M4. `env.dist` comment says "default: Admin" but the default is only applied in code

The `env.dist` entry documents the default but a user reading `env.dist` might expect the blank value to mean "no admin name" rather than "will default to Admin". Minor UX concern.

## Questions for the Team

### Q1. Is `observer.company_save_commit_after` the correct B2B event name?

The plan acknowledges this event is not in `EVENTS_SCHEMA.json`. B2B Commerce events may use a different naming convention (e.g., `observer.company_save_after` without `_commit`). Has this been verified against an actual B2B-enabled Commerce instance?

### Q2. Does the company event payload actually nest under `data.value`?

The plan assumes `params.data.value` structure matching standard Commerce events. B2B module events may structure payloads differently. The defensive fallbacks help, but if the entire nesting is different, the consumer will fail at `params.data.value`.

### Q3. Should the consumer handle company updates/deletes in the future?

The plan's scope explicitly excludes update/delete. But the consumer's switch/case currently only handles one event type. If updates are added later, the consumer will need refactoring. Should the consumer be structured with a single case (matching the plan) or with a placeholder for future cases?
