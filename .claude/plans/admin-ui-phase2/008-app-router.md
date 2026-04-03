# Task 008: App.jsx Router

**Status**: completed
**Depends on**: 004, 005, 006, 007
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/App.jsx` — the React Router entry point that wraps all views in `ExtensionRegistration` and declares the three routes: rule list (`/`), create rule (`/rules/new`), and edit rule (`/rules/edit/:country/:region`).

## Context

- Uses React Router v6 (`createBrowserRouter` or `<BrowserRouter>` + `<Routes>`).
- `ExtensionRegistration` wraps the router outlet so registration happens before any page renders.
- Routes:
  - `/` → `RuleList`
  - `/rules/new` → `RuleForm` (create mode)
  - `/rules/edit/:country/:region` → `RuleForm` (edit mode)
- `index.html` renders `<div id="root">` which mounts `App` via `ReactDOM.createRoot`.
- Related files:
  - Task 004 — `ExtensionRegistration.jsx`
  - Task 005 — `DeleteConfirm.jsx` (used inside RuleList, not directly in App)
  - Task 006 — `RuleList.jsx`
  - Task 007 — `RuleForm.jsx`

## Requirements (Test Descriptions)

- [ ] `it renders RuleList at the root path`
- [ ] `it renders RuleForm in create mode at /rules/new`
- [ ] `it renders RuleForm in edit mode at /rules/edit/:country/:region`
- [ ] `it wraps all routes with ExtensionRegistration`
- [ ] `it renders a 404 not found message for unknown routes`

## Acceptance Criteria

- All requirements have passing tests (mock all child components and React Router `MemoryRouter`)
- App is exported as default and mounted from `index.html`
- `ExtensionRegistration` always wraps child routes

## Implementation Notes

(Left blank - filled in by programmer during implementation)
