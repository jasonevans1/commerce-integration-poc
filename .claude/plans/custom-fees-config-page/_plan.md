# Plan: Custom Fees Configuration Page

## Created

2026-04-13

## Status

completed

## Objective

Add a "Custom Fees" configuration page to the Commerce Admin under Stores > Settings, using the Admin UI SDK, that allows admins to fully manage (create, edit, delete) delivery fee rules stored in Adobe I/O State.

## Scope

### In Scope

- Register a new Stores > Settings page via the Admin UI SDK registration action
- A table-based configuration page listing all current fee rules
- A modal form for creating and editing rules (fields: country, region, name, type, value)
- A confirmation dialog for deleting rules
- A reusable API utility that calls the existing backend delivery-fee actions with IMS auth
- Route wiring in App.jsx
- Unit tests for all new components and the API utility
- Update/remove stale scaffolding assertions in task-010-verification.test.js

### Out of Scope

- Changes to existing backend delivery-fee actions
- Hello World mass action (unchanged)
- order.customFees registration (unchanged)
- Role-based access control (accessible to all admin users)
- Type field special handling (basic text input only)

## Success Criteria

- [ ] Stores > Settings menu item appears in Commerce Admin pointing to the new page
- [ ] Configuration page renders a table of all fee rules fetched from the backend
- [ ] Add Rule button opens a modal form; submitting creates a new rule
- [ ] Edit action opens the modal pre-filled; submitting updates the rule
- [ ] Delete action opens a confirmation dialog; confirming deletes the rule
- [ ] Table refreshes after any CUD operation
- [ ] All tests passing (frontend coverage thresholds maintained)
- [ ] Code follows biome.jsonc standards

## Task Overview

| Task | Description                                  | Depends On      | Status    |
| ---- | -------------------------------------------- | --------------- | --------- |
| 001  | Register Stores > Settings page in Admin SDK | -               | completed |
| 002  | Create fee rules API utility                 | -               | completed |
| 003  | Create CustomFeesConfig table page component | 002             | completed |
| 004  | Create RuleForm modal component              | 002,003         | completed |
| 005  | Create DeleteConfirm dialog component        | 003             | completed |
| 006  | Wire App.jsx routes and clean up stale tests | 001,003,004,005 | completed |

## Architecture Notes

- **Extension point**: The Admin UI SDK registration action (`src/commerce-backend-ui-1/actions/registration/index.js`) returns the registration payload. Use `search-commerce-docs` to verify the exact schema for registering a Stores > Settings page before coding.
- **Frontend stack**: React 18 + React Spectrum + React Router v6 (HashRouter). Follow patterns in `HelloWorldPanel.jsx` and `ExtensionRegistration.jsx`.
- **Auth**: IMS token is available via `props.ims.token` passed from App.jsx. Pass it down to CustomFeesConfig and into the API utility for Bearer auth. Verify whether `x-gw-ims-org-id` header is also required for `require-adobe-auth: true` web actions.
- **Action URLs -- CAUTION**: The delivery-fee actions are in the root application package (`app.config.yaml > packages > delivery-fee`), NOT in the `commerce/backend-ui/1` extension. The extension's `config.json` at `web-src/src/config.json` only contains the extension's own action URLs (currently just `admin-ui-sdk/registration`). It does NOT contain delivery-fee URLs. The API utility (task 002) must determine the correct mechanism for resolving cross-package action URLs (env vars, URL construction, etc.).
- **Test environment**: Frontend tests use jsdom + React Testing Library + `@testing-library/jest-dom`. Mock `@adobe/react-spectrum`, `@adobe/uix-guest`, `@adobe/exc-app` via `test/__mocks__/`. Test files go in `test/web-src/`.
- **Verification test**: `test/web-src/task-010-verification.test.js` currently asserts that RuleList/RuleForm/DeleteConfirm/api test files do NOT exist — these assertions must be removed in task 006.

## Risks & Mitigations

- **Admin UI SDK page extension point schema unknown**: Use `search-commerce-docs` MCP tool during task 001 to find the exact registration schema. Do not guess.
- **Delivery-fee action URLs not in extension config.json**: The delivery-fee actions are in a separate package from the extension. The extension's auto-generated `config.json` does not contain their URLs. Task 002 must determine the correct URL resolution mechanism. API utility should log a clear error and surface it in the UI if URLs cannot be resolved.
- **React Spectrum mock is incomplete**: The existing mock at `test/__mocks__/@adobe/react-spectrum.js` only exports 4 components (`DialogContainer`, `AlertDialog`, `Provider`, `lightTheme`). Task 003 must extend it with all components used by tasks 003-005. Tasks 004 and 005 depend on 003 to ensure the mock is extended before they run.
- **Coverage thresholds**: Frontend coverage is measured globally. Ensure all new components have adequate test coverage to stay above 80% lines/statements.
