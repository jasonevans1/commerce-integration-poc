# Task 004: Update app.config.yaml and env.dist

**Status**: completed
**Depends on**: [001, 002, 003]
**Retry count**: 0

## Description

Wire the `tax` package into `app.config.yaml` so it deploys with `aio app deploy`. Add the new environment variables to `env.dist` with comments explaining each. This task contains no business logic — only top-level configuration updates and documentation.

NOTE: `actions/tax/actions.config.yaml` is fully created and populated by tasks 002 and 003 (including `inputs: TAX_RATE_PERCENT: $TAX_RATE_PERCENT` and `inputs: COMMERCE_WEBHOOKS_PUBLIC_KEY: $COMMERCE_WEBHOOKS_PUBLIC_KEY` for both actions). This task does NOT modify that file.

## Context

- **app.config.yaml**: Add a `tax` package entry in `runtimeManifest.packages` that includes `actions/tax/actions.config.yaml`. Follow the same pattern as `delivery-fee`:
  ```yaml
  tax:
    license: Apache-2.0
    actions:
      $include: ./actions/tax/actions.config.yaml
  ```
- **env.dist**: Add the following new variables with explanatory comments:
  - `TAX_RATE_PERCENT` — flat rate percentage (e.g., `8.5` for 8.5%). Injected into action inputs via `actions/tax/actions.config.yaml`.
  - `COMMERCE_WEBHOOKS_PUBLIC_KEY` — public key (PEM format, single-line with `\n` escapes OR base64) for verifying webhook signatures from Commerce SaaS. Obtain from Commerce Admin: **Stores > Configuration > Adobe Services > Webhooks Configuration > Webhook Signature Generation > Generate Key Pair** (or similar — verify exact path against Commerce SaaS Admin), then copy the public key. Format: single-line PEM (BEGIN/END markers with `\n` escaped) — verify against the `crypto.createPublicKey` call in `actions/tax/*/validator.js`.
  - `TAX_COLLECT_URL` — the deployed `collect-taxes` action URL from `aio app deploy` output. Used when manually registering the synchronous webhook in Commerce Admin.
  - `TAX_COLLECT_ADJUSTMENT_URL` — the deployed `collect-adjustment-taxes` action URL from `aio app deploy` output. Same purpose.
- **Two-step Commerce setup documentation**: Add a comment block in `env.dist` (or a `TAX_SETUP.md` if preferred — confirm with team) explaining the post-deploy steps:
  1. Run `npm run create-tax-integrations` (registers the tax integration record via REST)
  2. Manually register the synchronous webhook in Commerce Admin pointing to the `TAX_COLLECT_URL` and `TAX_COLLECT_ADJUSTMENT_URL` action URLs (similar to the existing `WEBHOOK_QUOTE_TOTAL_URL` pattern in `.commerce-to-app-builder/webhooks.xml`).
- Related files to read:
  - `app.config.yaml` — add `tax` package entry here
  - `env.dist` — append new variables
  - `actions/delivery-fee/actions.config.yaml` — reference for input injection pattern
  - `.commerce-to-app-builder/webhooks.xml` (if present) — reference for how `WEBHOOK_QUOTE_TOTAL_URL` is consumed

## Requirements (Test Descriptions)

- [ ] `it adds tax package to app.config.yaml with correct $include path`
- [ ] `it preserves the existing delivery-fee, starter-kit, and other packages in app.config.yaml`
- [ ] `it adds TAX_RATE_PERCENT to env.dist with descriptive comment`
- [ ] `it adds COMMERCE_WEBHOOKS_PUBLIC_KEY to env.dist with descriptive comment`
- [ ] `it adds TAX_COLLECT_URL to env.dist with descriptive comment`
- [ ] `it adds TAX_COLLECT_ADJUSTMENT_URL to env.dist with descriptive comment`
- [ ] `it includes a comment in env.dist describing the two-step Commerce post-deploy setup (npm run create-tax-integrations + manual webhook registration)`

## Acceptance Criteria

- All requirements have passing tests (file-existence and content assertions)
- `app.config.yaml` includes the `tax` package pointing to `actions/tax/actions.config.yaml`
- `env.dist` documents `TAX_RATE_PERCENT`, `COMMERCE_WEBHOOKS_PUBLIC_KEY`, `TAX_COLLECT_URL`, `TAX_COLLECT_ADJUSTMENT_URL`
- `env.dist` includes a comment block describing the two-step post-deploy setup
- This task does NOT modify `actions/tax/actions.config.yaml` (already populated by tasks 002 and 003)
- Code passes Biome lint

## Implementation Notes

(Left blank — filled in by programmer during implementation)
