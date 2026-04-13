# Plan: Admin UI — Migrate to order.customFees Extension Point

## Created

2026-04-06

## Status

completed

## Objective

Replace the current `pages`-based admin navigation approach with the `order.customFees` extension point, aligning the SPA architecture to match the official Adobe Commerce sample at `adobe/adobe-commerce-samples/admin-ui-sdk/order/custom-fees`. The registration action will dynamically serve fee rules from the existing I/O State backend.

## Scope

### In Scope

- Replace `pages` registration with `order.customFees` in registration action
- Dynamically fetch delivery fee rules from I/O State and surface as custom fees
- Replace stateful React `ExtensionRegistration` component with sample's plain-function `init()` pattern
- Replace `BrowserRouter` with `HashRouter`
- Add full Experience Cloud Shell integration (`@adobe/exc-app`, `exc-runtime.js`, bootstrap logic)
- Add `react-error-boundary` to `App.js`
- Update `index.html` with explicit parcel entry-point `<script>` tag
- Fix `ext.config.yaml` `web` field to match sample (`web: web-src` not `web: src: web-src/`)
- Update `web-src/package.json` deps to match sample (`@adobe/uix-guest: ^0.8.3`, `@adobe/exc-app`, polyfills)
- Remove unused CRUD components (RuleList, RuleForm, DeleteConfirm, api.js, GuestConnectionContext)
- Update all tests to reflect new architecture

### Out of Scope

- Backend delivery fee API actions (Phase 1) — untouched
- `app.config.yaml` top-level — already correct (`extensions: commerce/backend-ui/1`)
- `install.yaml` / `extension-manifest.json` — already correct from prior fix
- Adding a management UI for rules within the order creation flow

## Success Criteria

- [ ] Registration action returns `body.registration.order.customFees[]` populated from I/O State rules
- [ ] `ExtensionRegistration` matches sample's plain-function `init()` pattern
- [ ] `App.js` uses `HashRouter`, `@adobe/exc-app` runtime, and `react-error-boundary`
- [ ] `index.js` bootstraps correctly for both standalone and ECS iframe modes
- [ ] `ext.config.yaml` `web` field matches sample format
- [ ] CRUD components and utilities removed
- [ ] All tests pass with updated assertions
- [ ] `npm run code:lint:fix && npm run code:format:fix` clean

## Task Overview

| Task | Description                                            | Depends On    | Status    |
| ---- | ------------------------------------------------------ | ------------- | --------- |
| 001  | Update registration action for order.customFees        | -             | completed |
| 002  | Fix ext.config.yaml web field                          | -             | completed |
| 003  | Update web-src dependencies                            | -             | completed |
| 004  | Replace ExtensionRegistration with sample pattern      | 003           | completed |
| 005  | Update App.js — HashRouter, ECS runtime, ErrorBoundary | 003           | completed |
| 006  | Replace index.jsx with ECS bootstrap pattern           | 003, 005      | completed |
| 007  | Update index.html with explicit script tag             | 006           | completed |
| 008  | Remove CRUD components and utilities                   | 004, 005      | completed |
| 009  | Update registration action tests (backend)             | 001           | completed |
| 010  | Update frontend + scaffolding tests, delete CRUD tests | 004, 005, 008 | completed |

## Architecture Notes

- The `order.customFees` extension point tells Commerce which fees to offer when an admin creates an order. Each fee needs: `id`, `label`, `value`, and optional `applyFeeOnLastCreditMemo`, `applyFeeOnLastInvoice`, `orderMinimumAmount`.
- The registration action reads from I/O State using the existing `state-service.listRules()`. Each rule (shape: `{ country, region, name, type, value }`) maps to a custom fee: `id = "delivery-fee-{country}-{region}"` (lowercase), `label = "Delivery Fee — {country}/{region}"`, `value = rule.value`.
- The ECS bootstrap in `index.js` handles two modes: running inside the Experience Cloud Shell iframe (uses `@adobe/exc-app`) and standalone (mock runtime). This is a required pattern for `commerce/backend-ui/1` extensions.
- `exc-runtime.js` is a static script that loads the Adobe Experience Cloud Module Runtime from within an iframe — must be added verbatim from the sample.

## Risks & Mitigations

- Empty state (no rules in I/O State): registration action should return empty `customFees: []` gracefully, not error
- State service requires I/O credentials at runtime: these are injected by App Builder via `.env`; no changes needed
- Removing CRUD pages means rules must be managed via the backend REST API directly; document this in acceptance criteria
