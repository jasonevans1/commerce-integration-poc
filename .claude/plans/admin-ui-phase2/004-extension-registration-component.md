# Task 004: ExtensionRegistration Component

**Status**: completed
**Depends on**: 001, 003
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration.jsx` — the component that calls `@adobe/uix-guest` to register the SPA with the Admin UI SDK host, declaring the "Delivery Fees" page route that the SDK will load inside the iFrame.

## Context

- `ExtensionRegistration` is rendered at the root of `App.jsx` and is the first thing the SDK iFrame loads.
- It uses `useEffect` to call `extensionPoint.register()` (or equivalent `@adobe/uix-guest` API) immediately after mount.
- It reads the action URL for the `registration` action from the App Builder guest context (not the IMS token — that is read by child components via `sharedContext`).
- The page route declared here must match the path used in `App.jsx` for the rule list view.
- Related files:
  - `src/commerce-backend-ui-1/web-src/src/utils/api.js` (Task 003) — imported by sibling components, not directly by this component
  - Any existing `@adobe/uix-guest` usage examples in the repo or referenced in ARCHITECTURE.md

## Requirements (Test Descriptions)

- [ ] `it calls extensionPoint init on mount to register with the Admin UI SDK host`
- [ ] `it renders null while registration is in progress`
- [ ] `it renders children after registration completes successfully`
- [ ] `it passes the correct page id and title to the registration call`
- [ ] `it does not re-register if already registered`

## Acceptance Criteria

- All requirements have passing tests (mock `@adobe/uix-guest` in tests)
- Component is exported as default from its file
- No real IMS or SDK network calls in tests

## Implementation Notes

(Left blank - filled in by programmer during implementation)
