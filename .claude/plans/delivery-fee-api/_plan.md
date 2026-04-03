---
name: Delivery Fee API (Phase 1)
description: App Builder runtime API for calculating custom delivery fees based on country/region rules stored in Adobe I/O State
type: project
---

# Plan: Delivery Fee API — Phase 1

## Created

2026-03-30

## Status

completed

## Objective

Build a public App Builder runtime API that calculates a custom delivery fee for a given shipping address (country + region) and quote subtotal, with admin actions to manage fee rules stored in Adobe I/O State.

## Scope

### In Scope

- `calculate` action: accepts `{ country, region, subtotal, currency }`, returns `{ fee, name, currency }`
- Rule CRUD actions: create/update, get, delete, list — all backed by `@adobe/aio-lib-state`
- Shared state service module wrapping `aio-lib-state`
- Configuration: `app.config.yaml` update + new `actions/delivery-fee/actions.config.yaml`
- All actions use the 6-file handler structure (index, validator, pre, transformer, sender, post)
- Public (unauthenticated) `calculate` action; rule management actions are internal (require-adobe-auth)

### Out of Scope

- Phase 2: Adding the fee to Commerce quote/order
- Phase 3: EDS storefront integration
- Admin UI for rule management
- Wildcard/fallback rule matching (strict exact match only)

## Success Criteria

- [ ] `calculate` action returns `{ fee, name, currency }` for a matching rule
- [ ] `calculate` action returns `{ fee: 0, name: "No delivery fee applies", currency }` when no rule matches
- [ ] Fee can be configured as fixed amount or percentage of subtotal
- [ ] Rule CRUD actions correctly persist and retrieve rules from I/O State
- [ ] All actions follow the 6-file handler structure
- [ ] All tests passing
- [ ] Code follows project biome standards

## Task Overview

| Task | Description                         | Depends On | Status    |
| ---- | ----------------------------------- | ---------- | --------- |
| 001  | Configuration files                 | -          | completed |
| 002  | Shared state service module         | -          | completed |
| 003  | Calculate fee action (6 files)      | 001, 002   | completed |
| 004  | Create/update rule action (6 files) | 001, 002   | completed |
| 005  | Get rule action (6 files)           | 001, 002   | completed |
| 006  | Delete rule action (6 files)        | 001, 002   | completed |
| 007  | List rules action (6 files)         | 001, 002   | completed |

## Architecture Notes

- New package: `delivery-fee` under `actions/delivery-fee/`
- Actions config: `actions/delivery-fee/actions.config.yaml` included from root `app.config.yaml`
- State key format: `rule.{COUNTRY}.{REGION}` (e.g., `rule.US.CA`) -- periods used as separators because `aio-lib-state` v5 only allows `[a-zA-Z0-9-_.]` in keys (no colons)
- Rule schema: `{ country, region, name, type: "fixed"|"percentage", value: number }`
- `calculate` action: `web: 'yes'`, `require-adobe-auth: false` (public)
- Rule CRUD actions: `web: 'yes'`, `require-adobe-auth: true` (internal)
- Shared module at `actions/delivery-fee/lib/state-service.js`
- `@adobe/aio-lib-state` v5.1.0 already present in project dependencies

## Risks & Mitigations

- State cold start latency: acceptable for checkout UX; mitigate with efficient single `get()` call
- No auth on calculate action: intentional per requirements; rule management actions are auth-protected
- State eventual consistency on list: acceptable since rule updates are infrequent admin operations
- **State TTL ceiling:** `aio-lib-state` v5 has no infinite TTL; max is 1 year (31536000s). Rules must be stored with `{ ttl: 31536000 }`. A future scheduled action should refresh TTLs before expiry.
- **List N+1 queries:** `aio-lib-state` v5 `list()` returns only keys, not values. `listRules()` requires a `get()` per key. Acceptable for the expected small rule set (tens, not thousands).
