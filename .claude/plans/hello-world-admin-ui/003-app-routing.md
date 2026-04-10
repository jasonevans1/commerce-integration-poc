---
name: 003-app-routing
description: Add /hello-world route to App.jsx to wire up the HelloWorldPanel
type: project
---

# Task 003: Add /hello-world Route in App.jsx

**Status**: completed
**Depends on**: [002]
**Retry count**: 0

## Description

Update `src/commerce-backend-ui-1/web-src/src/App.jsx` to add a `/hello-world` route that renders `HelloWorldPanel`. This is the URL the Admin SDK will load in an iFrame when the Hello World mass action is clicked. The route must match the `path` declared in the backend registration (task 001).

## Context

- **File to modify**: `src/commerce-backend-ui-1/web-src/src/App.jsx`
- The app uses `react-router-dom` v6 with `HashRouter` — routes are prefixed with `#`
- The backend registration uses `path: "index.html#/hello-world"` — so the route path must be `/hello-world`
- Import `HelloWorldPanel` from `./components/HelloWorldPanel.jsx`
- Add a new `<Route path="/hello-world" element={<HelloWorldPanel />} />` alongside the existing index route
- The existing `ExtensionRegistration` index route must remain unchanged

## Requirements (Test Descriptions)

- [ ] `it renders HelloWorldPanel when the route is /hello-world`
- [ ] `it still renders ExtensionRegistration at the index route`
- [ ] `it imports HelloWorldPanel from ./components/HelloWorldPanel.jsx`

## Acceptance Criteria

- `App.jsx` imports `HelloWorldPanel`
- A `<Route path="/hello-world">` exists in the `<Routes>` block
- The index route (`<Route index>`) with `ExtensionRegistration` is unchanged
- Code passes lint and format checks

## Implementation Notes

(Left blank — filled in by programmer during implementation)
