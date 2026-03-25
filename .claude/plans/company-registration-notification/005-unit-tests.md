# Task 005: Write Unit Tests

**Status**: completed
**Depends on**: [001, 002, 003]
**Retry count**: 0

## Description

Create comprehensive unit tests for the company commerce handler and consumer. Tests mirror the structure of existing tests in `test/actions/customer/commerce/` and cover all requirements from tasks 002 and 003.

## Context

- Related files (patterns to follow):
  - `test/actions/customer/commerce/created/created.test.js` — index.js test pattern
  - `test/actions/customer/commerce/consumer/consumer.test.js` — consumer test pattern
  - `test/actions/customer/external/created/validator.test.js` — validator test pattern
  - `test/actions/customer/external/created/sender.test.js` — sender test pattern (uses `nock` to mock HTTP)
- Files to create:
  - `test/actions/company/commerce/created/validator.test.js`
  - `test/actions/company/commerce/created/transformer.test.js`
  - `test/actions/company/commerce/created/sender.test.js`
  - `test/actions/company/commerce/created/created.test.js`
  - `test/actions/company/commerce/consumer/consumer.test.js`
- Use `nock` to mock `https://api.resend.com` in sender tests
- Use Jest mocks for `@adobe/aio-lib-state` and `@adobe/aio-lib-telemetry`
- For consumer tests, mock the `openwhisk` npm package (NOT the local `../../../openwhisk` wrapper): use `jest.mock("openwhisk")` and `const openwhisk = require("openwhisk")` then `openwhisk.mockReturnValue({ actions: { invoke: jest.fn().mockResolvedValue(...) } })` -- this matches the existing pattern in `test/actions/customer/commerce/consumer/consumer.test.js`
- Test files follow the same `describe` / `it` / `beforeEach` structure as existing tests

## Requirements (Test Descriptions)

### validator.test.js

- [ ] `it returns success true for valid company data with id and company_name`
- [ ] `it returns success false when data is missing`
- [ ] `it returns success false when data.id is missing`
- [ ] `it returns success false when data.company_name is missing`
- [ ] `it returns success false when data.company_name is an empty string`

### transformer.test.js

- [ ] `it maps data.id to companyId`
- [ ] `it maps data.company_name to companyName`
- [ ] `it maps data.company_email to customerName`
- [ ] `it defaults customerName to "Unknown Customer" when company_email is absent`
- [ ] `it sets eventType to "created"`
- [ ] `it does not include a timestamp field`

### sender.test.js

- [ ] `it sends email to NOTIFICATION_EMAIL_TO via Resend API`
- [ ] `it uses NOTIFICATION_EMAIL_FROM as from address`
- [ ] `it defaults from address to "onboarding@resend.dev" when NOTIFICATION_EMAIL_FROM is not set`
- [ ] `it includes admin name in email body from ADMIN_NAME param`
- [ ] `it defaults admin name to "Admin" when ADMIN_NAME is not set`
- [ ] `it includes customer name in email body`
- [ ] `it includes company name in email subject and body link text`
- [ ] `it includes company admin URL as href in the company link`
- [ ] `it returns success true when email is sent successfully`
- [ ] `it returns success false with message when Resend API call fails`
- [ ] `it skips email send and returns success true when RESEND_API_KEY is missing`
- [ ] `it skips email send and returns success true when NOTIFICATION_EMAIL_TO is missing`

### created.test.js (index.js integration)

- [ ] `it returns success response when all steps complete`
- [ ] `it returns 400 error when validation fails`
- [ ] `it returns 500 error when sender fails`

### consumer.test.js

- [ ] `it returns 400 when params.type is missing`
- [ ] `it returns 400 when the event type is not supported`
- [ ] `it skips processing and returns success when event_id was already processed`
- [ ] `it marks event_id as processed in state with TTL 300 after first processing`
- [ ] `it invokes company-commerce/created when _isNew is true`
- [ ] `it skips created invocation and returns success when _isNew is false`
- [ ] `it skips created invocation and returns success when _isNew is absent`
- [ ] `it returns success response when created action invocation succeeds`
- [ ] `it returns error response when created action invocation returns failure`

## Acceptance Criteria

- All requirements have passing tests (`npm test`)
- Tests use `nock` for HTTP mocking (not `jest.fn()` for got)
- No test leaves behind global state (proper `afterEach` / `nock.cleanAll()`)
- Test structure mirrors existing test files
