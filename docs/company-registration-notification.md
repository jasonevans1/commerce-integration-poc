# Company Registration Notification

Sends an admin notification email via Resend whenever a new B2B company registration is submitted in Adobe Commerce.

---

## Overview

When a merchant registers a new company through the Adobe Commerce B2B storefront, the account is placed in a pending/locked state until a site admin approves or rejects it. This integration listens for the `observer.company_save_commit_after` event and immediately emails the configured site admin so they can take action.

---

## Event

| Property                   | Value                                  |
| -------------------------- | -------------------------------------- |
| Event name                 | `observer.company_save_commit_after`   |
| Provider                   | Commerce Provider (I/O Events)         |
| Fires on                   | Every company save (create and update) |
| New registration detection | `data.value._isNew === true`           |

### Payload Fields Used

| Field                     | Type    | Description                                                                |
| ------------------------- | ------- | -------------------------------------------------------------------------- |
| `entity_id`               | string  | Company identifier (note: docs say `id`; runtime payload uses `entity_id`) |
| `company_name`            | string  | Registered company name                                                    |
| `company_email`           | string  | Company contact email                                                      |
| `company_admin.firstname` | string  | First name of the submitting customer                                      |
| `company_admin.lastname`  | string  | Last name of the submitting customer                                       |
| `_isNew`                  | boolean | `true` on initial creation; `false` on subsequent saves                    |

> **Note:** The documented schema uses `id` but the live B2B runtime payload uses `entity_id`. The handler uses `entity_id`.

---

## Architecture

```
Commerce B2B
    │  observer.company_save_commit_after
    ▼
Adobe I/O Events
    │
    ▼
company-commerce/consumer          ← idempotency check (aio-lib-state, TTL 300s)
    │  _isNew === true?
    ├─ no  → skip (update event)
    └─ yes
         ▼
    company-commerce/created
         │
         ├── validator.js          ← requires entity_id + company_name
         ├── transformer.js        ← maps payload to email variables
         ├── sender.js             ← POST https://api.resend.com/emails
         ├── pre.js                ← logging
         └── post.js               ← logging
```

### Action Files

| File          | Path                                              |
| ------------- | ------------------------------------------------- |
| Consumer      | `actions/company/commerce/consumer/index.js`      |
| Handler entry | `actions/company/commerce/created/index.js`       |
| Validator     | `actions/company/commerce/created/validator.js`   |
| Transformer   | `actions/company/commerce/created/transformer.js` |
| Sender        | `actions/company/commerce/created/sender.js`      |
| Pre-process   | `actions/company/commerce/created/pre.js`         |
| Post-process  | `actions/company/commerce/created/post.js`        |
| Metrics       | `actions/company/commerce/metrics.js`             |

---

## Email

### Template

```html
<p class="greeting company-greeting"><strong>Dear {ADMIN_NAME},</strong></p>
<p>
  A company registration request has been submitted by customer {customerName}.
  The account is temporarily locked until you approve or reject this company.
</p>
<p>
  <a href="{companyAdminUrl}">{companyName}</a>
</p>
```

### Variable Mapping

| Template variable   | Source                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `{ADMIN_NAME}`      | `ADMIN_NAME` env var (default: `"Admin"`)                           |
| `{customerName}`    | `company_admin.firstname + lastname`; falls back to `company_email` |
| `{companyName}`     | `company_name` from event payload                                   |
| `{companyAdminUrl}` | `{COMMERCE_BASE_URL}/admin/company/index/edit/id/{entity_id}`       |

### Subject

```
New Company Registration: {companyName}
```

---

## Environment Variables

| Variable                  | Required | Description                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `RESEND_API_KEY`          | Yes      | Resend API bearer token                                          |
| `NOTIFICATION_EMAIL_TO`   | Yes      | Admin email address to receive notifications                     |
| `NOTIFICATION_EMAIL_FROM` | No       | Sender address (default: `onboarding@resend.dev`)                |
| `ADMIN_NAME`              | No       | Admin display name used in email greeting (default: `Admin`)     |
| `COMMERCE_BASE_URL`       | Yes      | Commerce API base URL — used to construct the company admin link |

If `RESEND_API_KEY` or `NOTIFICATION_EMAIL_TO` are not set, the handler logs a message and returns success without sending — no error is thrown.

---

## Configuration

### `app.config.yaml`

```yaml
company-commerce:
  license: Apache-2.0
  actions:
    $include: ./actions/company/commerce/actions.config.yaml
```

### `actions/company/commerce/actions.config.yaml`

```yaml
consumer:
  function: consumer/index.js
  web: "no"
  runtime: nodejs:22
  inputs:
    LOG_LEVEL: debug
    EVENT_PREFIX: $EVENT_PREFIX
    ENABLE_TELEMETRY: true
  annotations:
    require-adobe-auth: true
    final: true
created:
  function: created/index.js
  web: "no"
  runtime: nodejs:22
  inputs:
    LOG_LEVEL: debug
    ENABLE_TELEMETRY: true
    RESEND_API_KEY: $RESEND_API_KEY
    NOTIFICATION_EMAIL_FROM: $NOTIFICATION_EMAIL_FROM
    NOTIFICATION_EMAIL_TO: $NOTIFICATION_EMAIL_TO
    ADMIN_NAME: $ADMIN_NAME
    COMMERCE_BASE_URL: $COMMERCE_BASE_URL
  annotations:
    require-adobe-auth: true
    final: true
```

### `scripts/onboarding/config/starter-kit-registrations.json`

The `company` entity is registered with the `commerce` provider only (no backoffice sync):

```json
"company": ["commerce"]
```

### `scripts/onboarding/config/events.json`

Event metadata and sample payload are defined under `company.commerce`.

### `scripts/commerce-event-subscribe/config/commerce-event-subscribe.json`

Subscribes all company fields:

```json
{
  "event": {
    "name": "observer.company_save_commit_after",
    "fields": [{ "name": "*" }]
  }
}
```

---

## Idempotency

The consumer uses `@adobe/aio-lib-state` to prevent duplicate emails when Adobe I/O Events replays a delivery. On first receipt, the `event_id` is stored with a 300-second TTL. Subsequent deliveries of the same event are detected and skipped.

---

## Deployment

```bash
# 1. Add environment variables to .env
ADMIN_NAME=Your Name

# 2. Deploy actions
aio app deploy

# 3. Register the I/O Events registration
npm run onboard

# 4. Subscribe the event in Commerce
npm run commerce-event-subscribe
```

---

## Implementation Notes

- **`entity_id` vs `id`**: Adobe Commerce B2B documentation describes the field as `id` (int), but the live runtime payload delivers it as `entity_id` (string). The validator, transformer, and pre-save guard all use `entity_id`.
- **`company_admin` object**: The live payload includes a nested `company_admin` object with `firstname`, `lastname`, and `email` for the customer who submitted the registration. The transformer uses this for the `$customer` variable in the email. This object is not described in the official event schema documentation.
- **New vs update detection**: The `_isNew` boolean in the payload is used directly to distinguish new registrations from subsequent saves. No `created_at`/`updated_at` date comparison is needed (unlike the customer handler pattern).
- **`commerce-event-subscribe` 400 errors**: Running `npm run commerce-event-subscribe` produces 400 errors for all previously subscribed events. This is expected — the Commerce SaaS eventing API does not idempotently handle re-subscription requests. Only the `company_save_commit_after` line in the output confirms success.
