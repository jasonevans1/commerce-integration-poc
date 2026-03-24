---
name: platform-context
description: Reference knowledge for Adobe Commerce App Builder development — PaaS vs SaaS differences, supported events catalog, App Builder fundamentals, and project structure. Use when you need platform context, want to understand event options, or need App Builder configuration reference.
---

# Adobe Commerce Platform Context

## Adobe Commerce Ecosystem

Composable, API-first e-commerce platform for B2C/B2B. Extensibility via tight integrations with ERP/CRM/PIM using out-of-process App Builder extensions.

---

## PaaS vs SaaS (CRITICAL)

They are **not interchangeable**. Code, authentication, and extension techniques differ.

| Feature                 | Adobe Commerce PaaS (Cloud Infrastructure)         | Adobe Commerce SaaS (Cloud Service)               |
| :---------------------- | :------------------------------------------------- | :------------------------------------------------ |
| **Extensibility Model** | In-process & Out-of-process. Core is accessible.   | Primarily Out-of-process. Core is locked.         |
| **Module Installation** | Manual via `composer require`.                     | Modules pre-installed by Adobe.                   |
| **Authentication**      | IMS optional (recommended). Legacy auth available. | IMS (Identity Management Services) mandatory.     |
| **GraphQL API**         | Separate endpoints for core and catalog services.  | Single unified GraphQL endpoint.                  |
| **REST API**            | PaaS-specific REST API specification.              | SaaS-specific REST API specification.             |
| **Webhook Creation**    | Via XML configuration files or REST API.           | Via Admin UI or REST API (predefined event list). |
| **Event Registration**  | Via XML or REST API. May require redeployment.     | Via Admin UI or REST API (predefined event list). |
| **Storefront**          | Luma available. EDS requires additional config.    | EDS (Edge Delivery Services) only.                |

### Authentication Summary

**PaaS:**

- IMS OAuth 2.0 recommended for future compatibility
- Legacy OAuth 1.0a integration auth still supported

**SaaS (MANDATORY):**

- Backend services: IMS OAuth 2.0 Server-to-Server (JWT token exchange)
- User-facing SPAs: IMS OAuth 2.0 Authorization Grant (PKCE)

---

## Adobe Developer App Builder

Serverless JAMStack framework for out-of-process Commerce extensions.

**Two application types:**

- **Headless** — Runtime actions only (backend integrations)
- **SPA** — React + Runtime actions (includes Admin UI)

**Core components:**

- **Adobe I/O Runtime** — OpenWhisk-based serverless actions
- **Adobe I/O Events & Webhooks** — async event triggers + sync webhooks
- **API Mesh** — orchestrate multiple APIs into a single GraphQL endpoint
- **React Spectrum** — UI library for Admin UI extensions
- **State & Files storage** — multi-tenant isolated persistence

**Essential CLI commands:**

```bash
aio app dev        # local dev server with hot reload
aio app deploy     # deploy to Runtime
aio app logs       # stream activation logs
aio app test       # run tests
aio app undeploy   # remove deployed app
aio where          # show current org/project/workspace
```

**MCP tools (when available):**

- `commerce-extensibility:aio-app-dev`
- `commerce-extensibility:aio-app-deploy`
- `commerce-extensibility:aio-login`
- `commerce-extensibility:aio-where`
- `commerce-extensibility:aio-dev-invoke`
- `commerce-extensibility:onboard`
- `commerce-extensibility:commerce-event-subscribe`

---

## App Builder Project Structure

```
project-root/
├── app.config.yaml                    # Central application configuration
├── .env                               # Local secrets (gitignored)
├── .aio/                              # Org/project/workspace config
├── actions/                           # Runtime actions
│   └── <entity>/<system>/<event>/    # Handler directories (6 files each)
├── web-src/                           # SPA frontend (if applicable)
├── test/                              # Test files (mirror actions structure)
│   └── actions/<entity>/<system>/<event>/
└── scripts/
    ├── onboarding/config/
    │   ├── EVENTS_SCHEMA.json         # AUTHORITATIVE event payload schemas
    │   ├── events.json                # Event metadata and sample templates
    │   ├── providers.json             # Event provider definitions
    │   ├── starter-kit-registrations.json  # Entity-to-provider mappings
    │   └── workspace.json             # Workspace metadata (DO NOT DELETE)
    └── commerce-event-subscribe/config/
        └── commerce-event-subscribe.json   # Event subscription definitions
```

### Credential Management

```yaml
# app.config.yaml — reference via $VAR, never hardcode
inputs:
  COMMERCE_API_URL: $COMMERCE_BASE_URL
  CRM_API_KEY: $CRM_API_KEY
annotations:
  require-adobe-auth: true
  final: true # Prevents parameter override at invocation
```

- `.env` — local development only, must be gitignored
- Production secrets injected via CI/CD (GitHub Secrets, Azure Key Vault, etc.)

---

## Supported Events Reference

### Event Name Format (MANDATORY)

Event names in `commerce-event-subscribe.json` **must** include a type prefix:

```
✅ observer.catalog_product_save_commit_after
❌ catalog_product_save_commit_after   (causes 400 error)
```

### Product Events

**Commerce → External (observer events):**

- `catalog_product_delete_commit_after`
- `catalog_product_save_commit_after`

**External → Commerce (backoffice events):**

- `catalog_product_create`
- `catalog_product_update`
- `catalog_product_delete`

### Customer Events

**Commerce → External:**

- `customer_save_commit_after`
- `customer_delete_commit_after`
- `customer_group_save_commit_after`
- `customer_group_delete_commit_after`

**External → Commerce:**

- `customer_create`
- `customer_update`
- `customer_delete`
- `customer_group_create`
- `customer_group_update`
- `customer_group_delete`

### Order Events

**Commerce → External:**

- `sales_order_save_commit_after`

**External → Commerce:**

- `sales_order_status_update`
- `sales_order_shipment_create`
- `sales_order_shipment_update`

### Stock Events

**Commerce → External:**

- `cataloginventory_stock_item_save_commit_after`

**External → Commerce:**

- `catalog_stock_update`

### Event Selection Strategy

| Data Flow Direction | Event Pattern                                   |
| :------------------ | :---------------------------------------------- |
| Commerce → External | Use `*_commit_after` observer events            |
| External → Commerce | Use backoffice events                           |
| Bidirectional       | Implement both directions + conflict resolution |

### EVENTS_SCHEMA.json (Authoritative Source)

The file `scripts/onboarding/config/EVENTS_SCHEMA.json` defines every available field and its data type for each event. **Always consult this file** before:

- Designing event subscriptions
- Writing validator/transformer code
- Deciding which fields to subscribe to

**Data type notation used in the schema:**

- `int`, `string`, `float`, `bool`/`boolean`
- `array`, `object{}`, `object{}[]`, `string[]`, `int[]`, `mixed`

**Three-step validation flow:**

```
Step 1: Check EVENTS_SCHEMA.json → does the field exist? What type?
   ↓
Step 2: Update commerce-event-subscribe.json → subscribe to required fields
   ↓
Step 3: Write action code → access fields confidently
```

---

## Storage Decision Matrix

| Scenario                  | Use                         | Reason                              |
| :------------------------ | :-------------------------- | :---------------------------------- |
| Sync status tracking      | **State** (`aio-lib-state`) | < 100KB, fast, TTL auto-cleanup     |
| API response caching      | **State**                   | Frequently accessed, TTL expiration |
| Webhook processing state  | **State**                   | Small, fast, TTL cleanup            |
| Product feed export (CSV) | **Files** (`aio-lib-files`) | Large payload, shareable URL        |
| Generated PDF/binary      | **Files**                   | Binary data, presigned URL          |
| Session data              | **State**                   | Small, needs expiration             |
| Image processing results  | **Files**                   | Binary, large                       |

**State regions:** `amer`, `emea`, `apac` — always make region configurable, never hardcode.

---

## Scheduled Actions (Cron)

Use **alarm triggers** in `app.config.yaml` — never external cron services.

```yaml
triggers:
  daily-sync:
    feed: /whisk.system/alarms/alarm
    inputs:
      cron: "0 2 * * *" # 2 AM UTC daily
      maxTriggers: 1
```

| Schedule        | Cron Expression |
| :-------------- | :-------------- |
| Every 5 minutes | `*/5 * * * *`   |
| Every hour      | `0 * * * *`     |
| Daily at 2 AM   | `0 2 * * *`     |
| Weekly Monday   | `0 0 * * 1`     |
| Monthly 1st     | `0 0 1 * *`     |
