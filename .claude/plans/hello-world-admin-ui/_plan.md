---
name: hello-world-admin-ui
description: Add a minimal Hello World extension point to the existing Admin UI SDK extension
type: project
---

# Plan: Hello World Admin UI Extension

## Created

2026-04-10

## Status

completed

## Objective

Add a minimal "Hello World" mass action to the Orders grid in the Adobe Commerce Admin panel, using the existing `commerce/backend-ui/1` extension. This demonstrates the complete Admin UI SDK integration pattern: backend registration → frontend route → embedded panel.

## Scope

### In Scope

- Add `order.massActions` Hello World entry to the backend registration action response
- Create a simple `HelloWorldPanel.jsx` React Spectrum component showing "Hello World"
- Add a `/hello-world` route in `App.jsx` to render the panel

### Out of Scope

- New App Builder project scaffolding (reuses existing `commerce-backend-ui-1`)
- Authentication or IMS token handling
- Any backend Runtime actions beyond the existing `registration/index.js` update
- Tests (not requested)
- Changes to existing delivery-fee functionality

## Success Criteria

- [ ] Backend registration action returns `order.massActions` with a Hello World entry
- [ ] `HelloWorldPanel.jsx` renders a "Hello World" heading with React Spectrum components
- [ ] `App.jsx` has a `/hello-world` route that renders the panel
- [ ] Code passes `npm run code:lint:fix && npm run code:format:fix` with no errors
- [ ] No existing tests broken

## Task Overview

| Task | Description                                 | Depends On | Status    |
| ---- | ------------------------------------------- | ---------- | --------- |
| 001  | Update backend registration for Hello World | -          | completed |
| 002  | Create HelloWorldPanel React component      | -          | completed |
| 003  | Add /hello-world route in App.jsx           | 002        | completed |

## Architecture Notes

- Extension lives in `src/commerce-backend-ui-1/`
- Backend registration at `src/commerce-backend-ui-1/actions/registration/index.js`
- Frontend React app at `src/commerce-backend-ui-1/web-src/src/`
- Mass action `path` must match the hash route in `App.jsx` (e.g. `index.html#/hello-world`)
- Panel components use `@adobe/react-spectrum` for consistent Adobe UI
- The Admin SDK loads the panel path in an iFrame when the user clicks the mass action
- Existing `order.customFees` registration must be preserved

## Risks & Mitigations

- Registration response structure mismatch: verify the exact JSON shape for `order.massActions` against Admin UI SDK docs before implementing task 001
- Route hash mismatch: the `path` in the backend registration must exactly match the hash route declared in `App.jsx`
