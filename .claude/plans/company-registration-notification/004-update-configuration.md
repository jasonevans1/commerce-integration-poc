# Task 004: Update Configuration Files

**Status**: completed
**Depends on**: [002, 003]
**Retry count**: 0

## Description

Wire up the new company commerce actions into the Adobe I/O App Builder configuration. This includes creating the `actions.config.yaml` for the company-commerce package, registering the package in `app.config.yaml`, adding the event subscription to `events.json`, updating `starter-kit-registrations.json`, and documenting the new env vars in `env.dist`.

## Context

- Related files (patterns to follow):
  - `actions/customer/commerce/actions.config.yaml` — config structure to mirror
  - `app.config.yaml` — add `company-commerce` package entry
  - `scripts/onboarding/config/events.json` — add company event + sample template
  - `scripts/onboarding/config/starter-kit-registrations.json` — add "company" entity
  - `env.dist` — document `ADMIN_NAME` env var
- Files to create:
  - `actions/company/commerce/actions.config.yaml`
- Files to modify:
  - `app.config.yaml`
  - `scripts/onboarding/config/events.json`
  - `scripts/onboarding/config/starter-kit-registrations.json`
  - `env.dist`

## actions/company/commerce/actions.config.yaml

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

## app.config.yaml changes

Add a new package entry after the `customer-backoffice` block:

```yaml
company-commerce:
  license: Apache-2.0
  actions:
    $include: ./actions/company/commerce/actions.config.yaml
```

## events.json changes

Add a `company` top-level key alongside `product`, `customer`, `order`, `stock`:

```json
"company": {
  "commerce": {
    "com.adobe.commerce.observer.company_save_commit_after": {
      "sampleEventTemplate": {
        "value": {
          "id": 1,
          "status": 0,
          "company_name": "Acme Corp",
          "company_email": "acme@example.com",
          "legal_name": "Acme Corporation",
          "country_id": "US",
          "region": "California",
          "postcode": "90210",
          "telephone": "555-1234",
          "customer_group_id": 1,
          "super_user_id": 123,
          "_isNew": true
        }
      }
    }
  }
}
```

## starter-kit-registrations.json changes

Add `"company"` with `["commerce"]`:

```json
{
  "product": ["commerce", "backoffice"],
  "customer": ["commerce", "backoffice"],
  "order": ["commerce", "backoffice"],
  "stock": ["commerce", "backoffice"],
  "company": ["commerce"]
}
```

## env.dist changes

Add after the existing Resend block:

```bash
# Company notification
ADMIN_NAME=                         # Display name used in company registration emails (default: Admin)
```

## Requirements (Test Descriptions)

- [ ] `it includes company-commerce package in app.config.yaml`
- [ ] `it includes consumer and created actions in company commerce actions.config.yaml`
- [ ] `it injects RESEND_API_KEY ADMIN_NAME and COMMERCE_BASE_URL into created action inputs`
- [ ] `it adds company entity to starter-kit-registrations.json`
- [ ] `it adds company_save_commit_after event to events.json under company.commerce`
- [ ] `it documents ADMIN_NAME in env.dist`

## Acceptance Criteria

- All config changes are syntactically valid YAML and JSON
- `app.config.yaml` renders correctly with `$include` directive
- `events.json` sample event template includes all required fields for testing
- `env.dist` documents `ADMIN_NAME`
