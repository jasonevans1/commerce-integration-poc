# Task 004: Update app.config.yaml and env.dist

**Status**: pending
**Depends on**: [001, 002, 003]
**Retry count**: 0

## Description

Wire the `tax` package into `app.config.yaml` so it deploys with `aio app deploy`. Add the new environment variables (`TAX_RATE_PERCENT`, `COMMERCE_WEBHOOKS_PUBLIC_KEY`) to `env.dist` with comments explaining each. This task contains no business logic — only configuration updates.

## Context

- **app.config.yaml**: Add a `tax` package entry in `runtimeManifest.packages` that includes `actions/tax/actions.config.yaml`. Follow the same pattern as `delivery-fee`:
  ```yaml
  tax:
    license: Apache-2.0
    actions:
      $include: ./actions/tax/actions.config.yaml
  ```
- **env.dist**: Add the following new variables with explanatory comments:
  - `TAX_RATE_PERCENT` — flat rate percentage (e.g., `8.5` for 8.5%). Injected into action inputs via app.config.yaml.
  - `COMMERCE_WEBHOOKS_PUBLIC_KEY` — public key for verifying webhook signatures from Commerce SaaS. Obtain from Commerce Admin: Stores > Configuration > Adobe Services > Adobe I/O Events > Regenerate Key Pair, then copy the public key. Format: single-line PEM or base64 depending on starter kit usage — check the starter kit source for exact format expected.
- **app.config.yaml action inputs**: The `collect-taxes` action needs `TAX_RATE_PERCENT` injected as an input. Update `actions/tax/actions.config.yaml` to add:
  ```yaml
  collect-taxes:
    inputs:
      TAX_RATE_PERCENT: $TAX_RATE_PERCENT
  ```
  (And similarly for `collect-adjustment-taxes` if it uses the same env var.)
- Related files to read:
  - `app.config.yaml` — add tax package entry here
  - `env.dist` — append new variables
  - `actions/delivery-fee/actions.config.yaml` — reference for input injection pattern

## Requirements (Test Descriptions)

- [ ] `it adds tax package to app.config.yaml with correct $include path`
- [ ] `it adds TAX_RATE_PERCENT to env.dist with descriptive comment`
- [ ] `it adds COMMERCE_WEBHOOKS_PUBLIC_KEY to env.dist with descriptive comment`
- [ ] `it injects TAX_RATE_PERCENT as an input in actions/tax/actions.config.yaml for collect-taxes`

## Acceptance Criteria

- All requirements have passing tests (file-existence and content assertions)
- `app.config.yaml` includes the `tax` package pointing to `actions/tax/actions.config.yaml`
- `env.dist` documents both new env vars
- Code passes Biome lint

## Implementation Notes

(Left blank — filled in by programmer during implementation)
