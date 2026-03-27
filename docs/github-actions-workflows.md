# GitHub Actions CI/CD Workflows

This project uses three GitHub Actions workflows to test, deploy to Stage, and promote to Production.

---

## Workflow Overview

```
Pull Request opened          Merge to main              GitHub Release published
        │                          │                              │
        ▼                          ▼                              ▼
  pr_test.yml              deploy_stage.yml              deploy_prod.yml
  ─────────────            ────────────────              ───────────────
  Install deps             Install deps                  Install deps
  Auth (OAuth S2S)         Auth (OAuth S2S)              Auth (OAuth S2S)
  Build                    Build                         Build
  Test                     Deploy → Stage                Deploy → Production
```

---

## Workflows

### `pr_test.yml` — Pull Request Gate

**Trigger:** Any pull request opened or updated against `main`

Authenticates with Adobe IMS and runs a build + test pass before a PR can be merged. No deployment occurs.

| Step             | Action                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| Checkout         | `actions/checkout@v4`                                                  |
| Node 22 setup    | `actions/setup-node@v4`                                                |
| Install deps     | `npm ci`                                                               |
| Setup AIO CLI    | `adobe/aio-cli-setup-action@1.3.0`                                     |
| Auth (OAuth S2S) | `adobe/aio-apps-action@4.0.0` — `oauth_sts` using `_STAGE` credentials |
| Build            | `adobe/aio-apps-action@4.0.0` — `build`                                |
| Test             | `adobe/aio-apps-action@4.0.0` — `test`                                 |

Uses Stage credentials for auth since there is no separate "dev" workspace.

---

### `deploy_stage.yml` — Deploy to Stage

**Trigger:** Push to `main` (i.e. after a PR is merged)

Deploys the application to the Stage App Builder workspace. All app-specific runtime variables (`COMMERCE_BASE_URL`, `RESEND_API_KEY`, etc.) are injected as environment variables on the Deploy step so the AIO CLI can substitute `$VAR` references in `actions.config.yaml`.

| Step             | Action                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| Checkout         | `actions/checkout@v4`                                                  |
| Node 22 setup    | `actions/setup-node@v4`                                                |
| Install deps     | `npm ci`                                                               |
| Setup AIO CLI    | `adobe/aio-cli-setup-action@1.3.0`                                     |
| Auth (OAuth S2S) | `adobe/aio-apps-action@4.0.0` — `oauth_sts` using `_STAGE` credentials |
| Build            | `adobe/aio-apps-action@4.0.0` — `build`                                |
| Deploy           | `adobe/aio-apps-action@4.0.0` — `deploy --noPublish`                   |

The `noPublish: true` flag deploys runtime actions without publishing to the Extension Registry — appropriate for a non-production workspace.

---

### `deploy_prod.yml` — Deploy to Production

**Trigger:** GitHub Release published (`released` event)

Deploys to the Production App Builder workspace. Triggered manually by creating and publishing a GitHub Release — this acts as the promotion gate between Stage and Production. Uses separate `_PROD` secrets so Production credentials are isolated from Stage.

| Step             | Action                                                                |
| ---------------- | --------------------------------------------------------------------- |
| Checkout         | `actions/checkout@v4`                                                 |
| Node 22 setup    | `actions/setup-node@v4`                                               |
| Install deps     | `npm ci`                                                              |
| Setup AIO CLI    | `adobe/aio-cli-setup-action@1.3.0`                                    |
| Auth (OAuth S2S) | `adobe/aio-apps-action@4.0.0` — `oauth_sts` using `_PROD` credentials |
| Build            | `adobe/aio-apps-action@4.0.0` — `build`                               |
| Deploy           | `adobe/aio-apps-action@4.0.0` — `deploy`                              |

---

## Authentication

All workflows use **OAuth Server-to-Server** (`oauth_sts`) via `adobe/aio-apps-action@4.0.0`. This is the current Adobe-recommended authentication method. Legacy JWT Bearer Grant (`auth` command) is not used.

Credentials are stored as GitHub repository secrets and are never committed to the repository.

---

## Secrets

Secrets are namespaced by environment (`_STAGE` / `_PROD`). Set them via:

```bash
gh secret set SECRET_NAME --body "value"
gh secret list  # verify
```

### Stage secrets

| Secret                                         | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| `CLIENTID_STAGE`                               | OAuth S2S Client ID                            |
| `CLIENTSECRET_STAGE`                           | OAuth S2S Client Secret                        |
| `TECHNICALACCID_STAGE`                         | Technical Account ID                           |
| `TECHNICALACCOUNTEMAIL_STAGE`                  | Technical Account Email                        |
| `IMSORGID_STAGE`                               | IMS Org ID                                     |
| `SCOPES_STAGE`                                 | OAuth scopes (comma-separated)                 |
| `AIO_RUNTIME_NAMESPACE_STAGE`                  | App Builder runtime namespace                  |
| `AIO_RUNTIME_AUTH_STAGE`                       | App Builder runtime auth key                   |
| `AIO_PROJECT_ID_STAGE`                         | App Builder project ID                         |
| `AIO_PROJECT_NAME_STAGE`                       | App Builder project name                       |
| `AIO_PROJECT_ORG_ID_STAGE`                     | App Builder org ID                             |
| `AIO_PROJECT_WORKSPACE_ID_STAGE`               | Stage workspace ID                             |
| `AIO_PROJECT_WORKSPACE_NAME_STAGE`             | Stage workspace name                           |
| `AIO_PROJECT_WORKSPACE_DETAILS_SERVICES_STAGE` | Services JSON array from `workspace.json`      |
| `COMMERCE_BASE_URL`                            | Commerce instance base URL                     |
| `COMMERCE_GRAPHQL_ENDPOINT`                    | Commerce GraphQL endpoint                      |
| `COMMERCE_CONSUMER_KEY`                        | Commerce REST OAuth consumer key               |
| `COMMERCE_CONSUMER_SECRET`                     | Commerce REST OAuth consumer secret            |
| `COMMERCE_ACCESS_TOKEN`                        | Commerce REST OAuth access token               |
| `COMMERCE_ACCESS_TOKEN_SECRET`                 | Commerce REST OAuth access token secret        |
| `EVENT_PREFIX`                                 | I/O Events provider prefix                     |
| `IO_MANAGEMENT_BASE_URL`                       | I/O Management API base URL                    |
| `IO_CONSUMER_ID`                               | I/O consumer ID                                |
| `IO_PROJECT_ID`                                | I/O project ID                                 |
| `IO_WORKSPACE_ID`                              | I/O workspace ID                               |
| `RESEND_API_KEY`                               | Resend.com API key for email notifications     |
| `NOTIFICATION_EMAIL_FROM`                      | Sender address for notification emails         |
| `NOTIFICATION_EMAIL_TO`                        | Recipient address for notification emails      |
| `EDS_STOREFRONT_URL`                           | Edge Delivery Services storefront URL          |
| `ADMIN_NAME`                                   | Admin display name used in notification emails |

Duplicate the `_STAGE` secrets with `_PROD` suffixes for the production environment.

---

## Developer Workflow: Building a New Integration End to End

This example walks through adding a new **inventory sync** integration — a Commerce event handler that sends stock updates to an external backoffice system.

### 1. Create a feature branch

```bash
git checkout -b feature/inventory-sync
```

### 2. Implement the integration locally

Add the 6 required handler files under `actions/stock/commerce/`:

```
actions/stock/commerce/
├── index.js          # Entry point, orchestrates the handler pipeline
├── validator.js      # Validates incoming event payload
├── pre.js            # Pre-processing (e.g. fetch additional data)
├── transformer.js    # Maps Commerce data to backoffice schema
├── sender.js         # Sends transformed data to external system
└── post.js           # Post-processing (e.g. logging, cleanup)
```

Register the action in `actions/stock/commerce/actions.config.yaml` and include it in `app.config.yaml`.

### 3. Write tests and verify locally

```bash
npm test                    # run full test suite
npm run code:lint:fix       # fix any lint issues
npm run code:format:fix     # fix formatting
```

Test the action locally against your Stage workspace:

```bash
aio app dev                 # starts local dev server
aio app use --ws Stage      # ensure you're targeting Stage
```

### 4. Open a Pull Request

```bash
git push origin feature/inventory-sync
gh pr create --title "feat(stock): add inventory sync to backoffice" --body "..."
```

**`pr_test.yml` triggers automatically.** GitHub runs install → build → test against the PR. The PR cannot be merged if this workflow fails.

```
✅ AIO App CI Test — Test PR   passed
```

### 5. Merge to main → auto-deploys to Stage

Once the PR is approved and merged:

**`deploy_stage.yml` triggers automatically.** The app is built and deployed to the Stage App Builder workspace within ~2 minutes.

```
✅ AIO App CI Stage — Deploy to Stage   passed
```

Verify the new action is live on Stage:

```bash
aio app use --ws Stage
aio runtime action list | grep stock
aio runtime action invoke starter-kit/stock-commerce-consumer --param ...
```

### 6. Promote to Production via GitHub Release

Once validated on Stage, promote to Production by creating a GitHub Release:

```bash
# Tag the commit
git tag v1.2.0
git push origin v1.2.0

# Create and publish the release
gh release create v1.2.0 --title "v1.2.0 - Inventory Sync" --notes "Adds real-time inventory sync to backoffice"
```

**`deploy_prod.yml` triggers automatically** when the release is published. The app is deployed to the Production workspace using `_PROD` credentials.

```
✅ AIO App CI Prod — Deploy to Prod   passed
```

### Summary

```
feature/inventory-sync
    │
    │  git push + gh pr create
    ▼
Pull Request
    │  pr_test.yml: install → build → test ✅
    │  code review + approval
    ▼
Merge to main
    │  deploy_stage.yml: install → build → deploy → Stage ✅
    │  manual verification on Stage
    ▼
gh release create v1.2.0
    │  deploy_prod.yml: install → build → deploy → Production ✅
    ▼
Live in Production
```
