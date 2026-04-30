# Plan: Checkout Starter Kit Tax Integration

## Created

2026-04-28

## Status

completed

## Objective

Integrate the Adobe Commerce Checkout Starter Kit's out-of-process tax integration into this existing App Builder project. Implements a flat-rate tax calculation via the `collect-taxes` synchronous webhook, registers the integration in Commerce via the `create-tax-integrations` script, and wires it through `app.config.yaml`.

## Scope

### In Scope

- `scripts/create-tax-integrations.js` adapted from the checkout starter kit
- `tax-integrations.yaml` configuration file
- `npm run create-tax-integrations` script entry in `package.json`
- `actions/tax/collect-taxes/` — 6-file webhook handler (flat rate logic)
- `actions/tax/collect-adjustment-taxes/` — 6-file webhook handler
- `actions/tax/actions.config.yaml`
- `app.config.yaml` updated with `tax` package
- `env.dist` updated with `TAX_RATE_PERCENT` and `COMMERCE_WEBHOOKS_PUBLIC_KEY`
- Unit tests for both actions
- Commerce Admin webhook registration instructions (documented, not automated)

### Out of Scope

- Payment method integration (checkout starter kit)
- Shipping method integration (checkout starter kit)
- Commerce webhook registration automation (manual via Admin UI)
- External tax API integration (AvaTax, TaxJar, etc.)
- `aio app deploy` — user runs manually after plan completes

## Success Criteria

- [ ] `npm run create-tax-integrations` registers the flat-rate integration in Commerce without error
- [ ] `collect-taxes` action returns correct flat-rate tax amounts for taxable line items
- [ ] `collect-adjustment-taxes` action returns zero-adjustment response
- [ ] Both actions registered in `app.config.yaml` with `require-adobe-auth: false` and `final: false` (matches `actions/delivery-fee/webhook-quote-total` reference)
- [ ] All 6 handler files present for each action
- [ ] All unit tests passing (`npm test`)
- [ ] Code passes Biome lint (`npm run code:report`)

## Task Overview

Tasks 005 and 006 from an earlier draft were merged into 002 and 003 respectively (TDD: same worker writes test + implementation together so the response contract is consistent).

| Task | Description                                                        | Depends On  | Status    |
| ---- | ------------------------------------------------------------------ | ----------- | --------- |
| 001  | Tax integration config and create script                           | -           | completed |
| 002  | Implement collect-taxes webhook action + tests                     | -           | completed |
| 003  | Implement collect-adjustment-taxes action + tests                  | 002         | completed |
| 004  | Update app.config.yaml and env.dist (no actions.config.yaml edits) | 001,002,003 | completed |

## Architecture Notes

- **Commerce type**: SaaS (`na1-sandbox.api.commerce.adobe.com`)
- **Auth**: IMS OAuth 2.0 Server-to-Server (existing OAUTH\_\* creds in .env)
- **Webhook type**: Synchronous — Commerce calls App Builder and waits for the response before proceeding
- **Webhook method**: `plugin.magento.out_of_process_tax_management.api.oop_tax_collection.collect_taxes`
- **Handler pattern**: 6-file structure identical to `actions/delivery-fee/webhook-quote-total/` (use as reference)
- **Source reference**: https://github.com/adobe/commerce-checkout-starter-kit — fetch actual implementation files from this repo and adapt, do not write from scratch
- **Tax package location**: `actions/tax/` (new directory)
- **Test location**: `test/actions/tax/{action-name}/`

## Risks & Mitigations

- **SaaS module availability**: The `module-out-of-process-tax-management` must be enabled on the sandbox — if the `POST /V1/oope_tax_management/tax_integration/:code` endpoint returns 404, the module isn't installed. Confirmed as enabled per user.
- **Webhook signature verification**: SaaS requires `COMMERCE_WEBHOOKS_PUBLIC_KEY` — must be set in `.env` for the webhook handler to verify incoming calls. Task 002 and 003 implement the verification in each action's `validator.js` (skip-if-key-absent for local dev). Task 004 adds the env var to `env.dist` with instructions and injects it as an action input via `app.config.yaml`.
- **One active tax integration**: Commerce only allows one active tax integration at a time. The `tax-integrations.yaml` sets `active: true` for one entry only.
