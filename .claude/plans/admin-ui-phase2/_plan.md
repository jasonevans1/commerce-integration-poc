# Plan: Admin UI Phase 2 — Delivery Fee Rule Management

## Created

2026-04-03

## Status

completed

## Objective

Build a React/Spectrum SPA embedded in the Commerce Admin via the Admin UI SDK (`commerce/backend-ui/1` extension point). Admins can CRUD delivery fee rules without API calls — the UI calls the existing Phase 1 rule actions using the IMS bearer token injected by the SDK.

## Scope

### In Scope

- `src/commerce-backend-ui-1/ext.config.yaml` — extension entry point config
- `src/commerce-backend-ui-1/actions/registration/index.js` — IMS-authenticated action that returns menu registration JSON for the Admin UI SDK
- `src/commerce-backend-ui-1/web-src/` — React SPA with Spectrum UI components
  - `utils/api.js` — authenticated fetch wrapper reading IMS token from `sharedContext`
  - `components/ExtensionRegistration.jsx` — registers the extension guest with the Admin UI SDK
  - `components/RuleList.jsx` — Spectrum table listing all rules with edit/delete actions
  - `components/RuleForm.jsx` — Spectrum form for creating and editing rules
  - `components/DeleteConfirm.jsx` — Spectrum dialog for delete confirmation
  - `App.jsx` — React Router entry point (list / create / edit views)
  - `public/index.html` — SPA entry point
- `app.config.yaml` — add `commerce/backend-ui/1` extension include
- React test infrastructure (jest-environment-jsdom + React Testing Library)

### Out of Scope

- Phase 3 (webhook / collect-fee action)
- Any modification to the Phase 1 rule actions (calculate, rules-\*)
- Custom Commerce Admin theme or branding
- Authentication logic beyond reading the IMS token from `sharedContext`

## Success Criteria

- [ ] Registration action returns valid menu JSON when called with a valid IMS token
- [ ] Registration action returns 401 when called without a valid IMS token
- [ ] React SPA renders the RuleList view and populates it via the rules-list action
- [ ] RuleForm creates a new rule via rules-create and redirects to the list
- [ ] RuleForm pre-populates when editing an existing rule and calls rules-create (upsert)
- [ ] DeleteConfirm calls rules-delete and removes the rule from the list
- [ ] `aio app deploy` succeeds with the extension registered
- [ ] "Delivery Fees" menu item appears under "Stores" in Commerce Admin after refresh
- [ ] All tests passing

## Task Overview

| Task | Description                         | Depends On         | Status    |
| ---- | ----------------------------------- | ------------------ | --------- |
| 001  | Configuration & project scaffolding | -                  | completed |
| 002  | Registration action                 | 001                | completed |
| 003  | React test setup & API utility      | -                  | completed |
| 004  | ExtensionRegistration component     | 001, 003           | completed |
| 005  | DeleteConfirm component             | 003                | completed |
| 006  | RuleList component                  | 003                | completed |
| 007  | RuleForm component                  | 003                | completed |
| 008  | App.jsx router                      | 004, 005, 006, 007 | completed |

## Architecture Notes

- Platform: **SaaS** (Adobe Commerce as a Cloud Service). Admin UI SDK is built-in — no PHP module installation required.
- The `registration` action must have `require-adobe-auth: true` (Admin UI SDK 3.0+ requirement).
- The React SPA reads the IMS token via `@adobe/uix-guest` `sharedContext.imsToken`.
- Only **one menu entry** per app is supported by the Admin UI SDK.
- `api.js` constructs action URLs dynamically from `process.env` action URLs injected by the App Builder build. The exact env var names depend on the package/action naming in `app.config.yaml` (see Task 003 for details).
- React component tests run in `jsdom` environment using React Testing Library; the existing backend tests continue using the `node` environment unchanged. Frontend test files live under `test/web-src/` to remain discoverable by the `npm test` script.
- The `web-src/` sub-project needs its own `package.json` with React, React Router, `@adobe/uix-guest`, and `@adobe/react-spectrum`. Testing dependencies (`jest-environment-jsdom`, `@testing-library/*`) go in the root `package.json` devDependencies.
- IMS token access: child components use a shared pattern (defined in Task 003) to access the IMS token -- either via `@adobe/uix-guest` hooks directly or via a React context populated by `ExtensionRegistration`.
- Auth on the `registration` action is enforced by the App Builder runtime via `require-adobe-auth: true`. The action code itself does not implement auth validation.
- The `extensions` block in `app.config.yaml` is a top-level sibling of `application`, not nested under `application.runtimeManifest.packages`.

## Risks & Mitigations

- **Admin UI SDK version drift**: The registration payload shape can vary across SDK versions. Validate against the [Admin UI SDK docs](https://developer.adobe.com/commerce/extensibility/admin-ui-sdk/) before finalising the registration action response.
- **jsdom test environment**: React component tests need `jest-environment-jsdom` and `@testing-library/react`. Add these as devDependencies and create a separate jest project config to avoid breaking the existing node-environment tests.
- **IMS token unavailable in tests**: Mock `@adobe/uix-guest` in all component tests; never hit a live IMS endpoint.
- **ext.config.yaml action path**: Actions under `src/` use a different relative path convention — confirm with existing App Builder examples before coding task 002.
