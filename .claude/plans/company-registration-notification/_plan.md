# Plan: Company Registration Notification

## Created

2026-03-24

## Status

completed

## Objective

Subscribe to the `observer.company_save_commit_after` event and send an admin notification email via Resend whenever a new B2B company registration is submitted, so the site admin can approve or reject the pending account.

## Scope

### In Scope

- New `actions/company/commerce/` handler directory (full 6-file structure)
- Consumer that subscribes to `observer.company_save_commit_after` and routes new registrations to the created handler
- Email notification to `NOTIFICATION_EMAIL_TO` via existing Resend integration
- Email body matching the specified template (admin greeting, customer name, company link)
- Registration of the new event in `events.json` and `starter-kit-registrations.json`
- `app.config.yaml` update to include the new `company-commerce` package
- New env vars: `ADMIN_NAME` (site admin display name), with `COMMERCE_BASE_URL` used to derive the company admin URL
- Unit tests for validator, transformer, sender, consumer, and handler index

### Out of Scope

- Company update or delete notifications
- External/backoffice company sync
- Company approval workflow automation
- Fetching customer data from Commerce REST API (use event payload fields only)

## Email Template

The rendered HTML to send:

```html
<p class="greeting company-greeting"><strong>Dear {ADMIN_NAME},</strong></p>
<p>
  A company registration request has been submitted by customer {customerName}.
  The account is temporarily locked until you approve or reject this company.
</p>
<p>
  <a href="{companyAdminUrl}">Company: {companyName}</a>
</p>
```

**Variable mapping:**
| Template var | Source |
|---|---|
| `ADMIN_NAME` | `params.ADMIN_NAME` (default: `"Admin"`) |
| `customerName` | `data.company_email` from event payload |
| `companyName` | `data.company_name` |
| `companyAdminUrl` | `${(params.COMMERCE_BASE_URL || "").replace(/\/+$/, "")}/admin/company/index/edit/id/${data.id}` |

> **Schema confirmed** from Adobe Commerce B2B docs. Key fields: `id`, `company_name`, `company_email`, `status`, `_isNew` (boolean). No `created_at`/`updated_at` in this event.

## Event Detection Logic

Commerce fires `company_save_commit_after` on every company save. The payload includes `_isNew: boolean` — use it directly:

```js
if (data._isNew === true) {
  // invoke company-commerce/created
}
```

Only invoke the `company-commerce/created` action when `_isNew === true`.

## Success Criteria

- [ ] `observer.company_save_commit_after` event is registered in `events.json`
- [ ] Consumer correctly routes new company saves to the created handler
- [ ] Consumer skips updated company saves
- [ ] Idempotency check prevents duplicate emails on replay
- [ ] Created handler sends email to `NOTIFICATION_EMAIL_TO` via Resend
- [ ] Email contains admin name, customer name, company name, and company admin URL
- [ ] Handler gracefully skips email send when `RESEND_API_KEY` or `NOTIFICATION_EMAIL_TO` are missing
- [ ] `app.config.yaml` includes `company-commerce` package
- [ ] All tests passing

## Task Overview

| Task | Description                                  | Depends On    | Status    |
| ---- | -------------------------------------------- | ------------- | --------- |
| 001  | Create company commerce metrics              | -             | completed |
| 002  | Create company created handler (all 6 files) | 001           | completed |
| 003  | Create company commerce consumer             | 001, 002      | completed |
| 004  | Update configuration files                   | 002, 003      | completed |
| 005  | Write unit tests                             | 001, 002, 003 | completed |

## Architecture Notes

- Mirror `actions/customer/commerce/` structure exactly — same 6-file pattern, same telemetry wrapping
- Consumer lives at `actions/company/commerce/consumer/index.js`; the created handler at `actions/company/commerce/created/`
- Use `@adobe/aio-lib-state` for idempotency (TTL 300s), same as customer consumer
- Use `got` for Resend API call, same as customer sender
- New env vars (`ADMIN_NAME`) must be added to `env.dist` and injected in `actions.config.yaml`
- The company admin URL pattern: `{COMMERCE_BASE_URL}admin/company/index/edit/id/{id}` — no new env var needed

## Risks & Mitigations

- **`customerName` is an email, not a display name**: The event payload has `company_email` but no customer first/last name. The `$customer` slot in the email will show the email address. This is acceptable given the payload — to show a name, a Commerce REST API call for `super_user_id` would be required (out of scope).
- **`_isNew` absent on some Commerce versions**: If an older B2B version omits `_isNew`, the consumer skips silently (same as an update). This is the safest default — no false positives on update saves.
- **COMMERCE_BASE_URL trailing slash**: Normalize with `.replace(/\/+$/, "")` before appending the admin path. Note: `String.prototype.trimEnd()` does NOT accept a character argument — it only removes whitespace.
