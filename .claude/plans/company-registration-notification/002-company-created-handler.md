# Task 002: Create Company Created Handler (All 6 Files)

**Status**: completed
**Depends on**: [001]
**Retry count**: 0

## Description

Implement all 6 required handler files for `actions/company/commerce/created/`. This handler receives company data from the consumer, validates it, transforms it, and sends an admin notification email via Resend.

## Context

- Related files (patterns to follow):
  - `actions/customer/commerce/created/index.js` — orchestration pattern
  - `actions/customer/commerce/created/validator.js` — validation pattern
  - `actions/customer/commerce/created/transformer.js` — transformer pattern
  - `actions/customer/commerce/created/sender.js` — Resend email pattern
  - `actions/customer/commerce/created/pre.js` — pre-process pattern
  - `actions/customer/commerce/created/post.js` — post-process pattern
- Files to create: `actions/company/commerce/created/{index,validator,transformer,sender,pre,post}.js`
- All files must use `@adobe/aio-lib-telemetry` instrumentation (`instrument`, `instrumentEntrypoint`, `getInstrumentationHelpers`)
- Telemetry config is imported from `../../../telemetry` (shared module)
- Responses are imported from `../../../responses`
- Constants are imported from `../../../constants`

## Email Template

The `sender.js` must render this HTML (with runtime values substituted):

```html
<p class="greeting company-greeting"><strong>Dear {adminName},</strong></p>
<p>
  A company registration request has been submitted by customer {customerName}.
  The account is temporarily locked until you approve or reject this company.
</p>
<p>
  <a href="{companyAdminUrl}">Company: {companyName}</a>
</p>
```

Subject line: `New Company Registration: {companyName}`

## Data Flow

**Consumer → index.js** passes `params.data` (the raw company event payload) plus env params.

**validator.js** — validate required fields:

- `data` is present and is an object
- `data.id` is present and truthy
- `data.company_name` is present and non-empty

**transformer.js** — extract and normalize:

```js
{
  companyId: data.id,
  companyName: data.company_name,
  customerName: data.company_email || "Unknown Customer",
  eventType: "created",
}
```

> **Schema confirmed**: event fields are `company_name`, `company_email`, `id`, `_isNew` — no `name`, `customer_email`, or `created_at`/`updated_at`.

**sender.js** — Resend email:

- `from`: `params.NOTIFICATION_EMAIL_FROM` (default: `"onboarding@resend.dev"`)
- `to`: `[params.NOTIFICATION_EMAIL_TO]`
- `adminName`: `params.ADMIN_NAME || "Admin"`
- `companyAdminUrl`: `` `${(params.COMMERCE_BASE_URL || "").replace(/\/+$/, "")}/admin/company/index/edit/id/${data.companyId}` ``
- If `RESEND_API_KEY` or `NOTIFICATION_EMAIL_TO` missing → log and return `{ success: true }` (graceful skip)

**pre.js** — log `Pre-processing company created event for company {companyId}`

**post.js** — log `Company created event completed - ID: {companyId}, type: {eventType}, success: {result.success}`

## Requirements (Test Descriptions)

### validator.js

- [ ] `it returns success true for valid company data with id and company_name`
- [ ] `it returns success false when data is missing`
- [ ] `it returns success false when data.id is missing`
- [ ] `it returns success false when data.company_name is missing`
- [ ] `it returns success false when data.company_name is an empty string`

### transformer.js

- [ ] `it maps data.id to companyId`
- [ ] `it maps data.company_name to companyName`
- [ ] `it maps data.company_email to customerName`
- [ ] `it defaults customerName to "Unknown Customer" when company_email is absent`
- [ ] `it sets eventType to "created"`
- [ ] `it does not include a timestamp field`

### sender.js

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

### index.js

- [ ] `it returns success response when all steps complete`
- [ ] `it returns 400 error when validation fails`
- [ ] `it returns 500 error when sender fails`

## Acceptance Criteria

- All requirements have passing tests
- All 6 files exist under `actions/company/commerce/created/`
- No copyright headers added
- Biome linting passes (`npm run code:lint:fix`)
