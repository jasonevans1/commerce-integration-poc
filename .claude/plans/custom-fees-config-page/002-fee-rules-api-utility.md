# Task 002: Create Fee Rules API Utility

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create a reusable API utility module that wraps calls to the existing delivery-fee backend actions. All API calls require an IMS Bearer token. The utility reads action URLs from the generated `config.json` file.

## Context

- **New file**: `src/commerce-backend-ui-1/web-src/src/utils/api.js`
- **Action URL resolution -- IMPORTANT**: The delivery-fee actions are defined in the **root application** package (`app.config.yaml > runtimeManifest > packages > delivery-fee`), NOT in the `commerce/backend-ui/1` extension. The extension's auto-generated `config.json` at `web-src/src/config.json` only contains the extension's own action URLs (e.g., `admin-ui-sdk/registration`) and does **NOT** contain delivery-fee URLs.
  - The worker MUST determine how the SPA resolves delivery-fee action URLs. Options to investigate:
    1. Check if `aio app build` / `aio app dev` injects env vars like `REACT_APP_ACTION_DELIVERY_FEE_RULES_LIST` into the webpack build for cross-package actions.
    2. Construct URLs from the App Builder namespace/package pattern (e.g., `https://{namespace}.adobeioruntime.net/api/v1/web/delivery-fee/rules-list`).
    3. Check if the root application's config.json is accessible or if there is a separate mechanism.
  - Do NOT assume config.json keys like `delivery-fee/rules-list` exist. Verify the actual mechanism before coding.
- **Auth**: Pass `Authorization: Bearer {token}` header on every request. The delivery-fee actions use `require-adobe-auth: true` + `final: true`. Verify whether `x-gw-ims-org-id` header is also required for Adobe-auth-protected web actions -- check App Builder docs or test with a sample call.
- **HTTP methods**: All backend actions use `web: 'yes'` which merges query params and POST body into `params`. Use POST with JSON body for create/update (rule fields in body). Use POST with JSON body containing `{ country, region }` for delete (params merge makes this equivalent to query params). Use GET (or POST with no body) for list.
- **`updateRule` calls the same endpoint as `createRule`**: The backend `rules-create` action is an upsert (creates or updates by country+region). There is no separate `rules-update` action. The `updateRule` function should call the same `rules-create` action URL as `createRule`.
- **Rule shape**: `{ country, region, name, type, value }`
- **Error handling**: Throw a descriptive Error if the action URL cannot be resolved or if the HTTP response is not ok
- **Test file**: `test/web-src/utils/api.test.js`

## Requirements (Test Descriptions)

- [x] `it calls the rules-list action URL with a Bearer token`
- [x] `it returns an array of rules from listRules`
- [x] `it calls the rules-create action URL with the rule payload and Bearer token`
- [x] `it returns the created rule from createRule`
- [x] `it calls the rules-create action URL with the updated rule payload for updateRule`
- [x] `it calls the rules-delete action URL with country and region for deleteRule`
- [x] `it throws an error when the rules-list URL is missing from config`
- [x] `it throws an error when the response status is not ok`

## Acceptance Criteria

- All requirements have passing tests
- Module exports: `listRules(token)`, `createRule(token, rule)`, `updateRule(token, rule)`, `deleteRule(token, country, region)`
- `updateRule` internally calls the same action URL as `createRule` (backend upsert)
- No hardcoded URLs -- action URLs resolved via the mechanism determined during implementation (env vars, config, or URL construction)
- Code follows biome.jsonc standards

## Implementation Notes

- **URL construction approach**: Derived delivery-fee action URLs by replacing `admin-ui-sdk/registration` suffix in the `registration` URL from `config.json`. This avoids hardcoding the namespace/workspace and works for any deployment environment.
- **`updateRule`**: Delegates directly to `createRule` since the backend `rules-create` action is an upsert.
- **`deleteRule`**: Returns `void` (no return value needed); body contains `{ country, region }` as the backend uses `web: 'yes'` param merging.
- **Auth**: Only `Authorization: Bearer {token}` header is required; `x-gw-ims-org-id` was not needed for these actions.
- **Scaffolding tests updated**: `test/config/admin-ui-phase2-scaffolding.test.js` and `test/web-src/task-010-verification.test.js` had pre-condition tests asserting the api files did not exist. Updated those assertions to `toBe(true)` to reflect the new state.
- **Biome compliance**: All numeric literals extracted to named constants; regex literals hoisted to top-level; unused variables removed.
