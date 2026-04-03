# Task 006: RuleList Component

**Status**: completed
**Depends on**: 003
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx` — the main view component rendering a React Spectrum `TableView` of all delivery fee rules. It fetches rules on mount via `api.listRules`, displays a loading state, and provides "Edit" and "Delete" action buttons per row. Clicking Delete opens the `DeleteConfirm` dialog; clicking Edit navigates to the RuleForm.

## Context

- Reads the IMS token using the shared pattern defined in Task 003 (either `useSharedContext()` from `@adobe/uix-guest` or a React context from `utils/guestConnection.js`). Check the implementation from Task 003 for the exact pattern before implementing.
- Uses `api.listRules(imsToken)` from Task 003.
- Renders `DeleteConfirm` (Task 005) inline, controlled by local state `ruleToDelete`.
- Calls `api.deleteRule(imsToken, country, region)` after the user confirms deletion, then refreshes the list.
- Uses React Router `useNavigate` to route to `/rules/edit/:country/:region` on Edit click.
- Related files:
  - `src/commerce-backend-ui-1/web-src/src/utils/api.js` (Task 003)
  - `src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx` (Task 005)

## Requirements (Test Descriptions)

- [ ] `it shows a loading indicator while fetching rules`
- [ ] `it renders a table row for each rule returned by the API`
- [ ] `it displays country, region, name, type, and value columns for each rule`
- [ ] `it shows an empty state message when no rules exist`
- [ ] `it shows an error message when the API call fails`
- [ ] `it opens the delete confirmation dialog when the delete button is clicked`
- [ ] `it calls deleteRule and refreshes the list after confirming deletion`
- [ ] `it dismisses the dialog without deleting when cancel is clicked`
- [ ] `it navigates to the edit route when the edit button is clicked`
- [ ] `it renders a Create New Rule button that navigates to the create route`

## Acceptance Criteria

- All requirements have passing tests (mock `api.js`, mock `@adobe/uix-guest`, mock React Router)
- Component is exported as default
- No hardcoded IMS token or action URLs

## Implementation Notes

(Left blank - filled in by programmer during implementation)
