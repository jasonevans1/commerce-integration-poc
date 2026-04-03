# Task 005: DeleteConfirm Component

**Status**: completed
**Depends on**: 003
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx` — a React Spectrum `DialogContainer` / `AlertDialog` that confirms deletion of a delivery fee rule. It is a presentational component: it receives the rule to delete, an `onConfirm` callback, and an `onCancel` callback via props.

## Context

- Uses `@adobe/react-spectrum` `AlertDialog` and `DialogContainer` (or `useDialogContainer`).
- The dialog is triggered externally (from RuleList). This component only renders the dialog UI and delegates action to callbacks.
- `onConfirm` is called by RuleList after this component signals confirmation; the actual `deleteRule` API call happens in RuleList.
- Related files:
  - `src/commerce-backend-ui-1/web-src/src/utils/api.js` (Task 003) — NOT imported by this component; deletion logic is in RuleList
  - `src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx` (Task 006) — parent that renders this component

## Requirements (Test Descriptions)

- [ ] `it renders the rule country and region in the dialog body`
- [ ] `it calls onConfirm when the delete button is clicked`
- [ ] `it calls onCancel when the cancel button is clicked`
- [ ] `it does not call onConfirm when cancel is clicked`
- [ ] `it does not call onCancel when delete is clicked`

## Acceptance Criteria

- All requirements have passing tests (mock `@adobe/react-spectrum` Dialog components as needed)
- Component accepts `rule`, `onConfirm`, and `onCancel` props
- No API calls inside this component

## Implementation Notes

(Left blank - filled in by programmer during implementation)
