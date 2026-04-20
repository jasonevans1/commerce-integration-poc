# Task 005: Create DeleteConfirm Dialog Component

**Status**: completed
**Depends on**: 003
**Retry count**: 0

## Description

Create a simple confirmation dialog that asks the user to confirm deletion of a fee rule before the parent component performs the delete API call.

## Context

- **New file**: `src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx`
- **Props**:
  - `rule` — the rule to delete `{ country, region, name, ... }`
  - `onConfirm()` — called when user confirms; parent is responsible for the API call and refresh
  - `onCancel()` — called when user dismisses
- **Content**: Show rule identifier (country/region or name) in the message so the user knows what they're deleting
- **UI library**: `@adobe/react-spectrum` -- use `Dialog`, `Heading`, `Divider`, `Content`, `ButtonGroup`, `Button`, `Text`
- **React Spectrum mock**: Task 003 will have extended `test/__mocks__/@adobe/react-spectrum.js` with basic component mocks. If any components needed here (e.g., `Dialog`, `Divider`, `Content`, `Text`) are not yet in the mock, add them. `DialogContainer`, `Button`, and `Heading` should already exist from prior tasks.
- **Test file**: `test/web-src/components/DeleteConfirm.test.jsx`

## Requirements (Test Descriptions)

- [x] `it renders the rule country and region in the confirmation message`
- [x] `it renders a confirm delete button`
- [x] `it renders a cancel button`
- [x] `it calls onConfirm when the delete button is clicked`
- [x] `it calls onCancel when the cancel button is clicked`

## Acceptance Criteria

- All requirements have passing tests
- Component does not make any API calls (parent handles deletion)
- Code follows biome.jsonc standards

## Implementation Notes

- Replaced the stub `DeleteConfirm.jsx` with a full implementation using `Dialog`, `Heading`, `Divider`, `Content`, `ButtonGroup`, `Button`, and `Text` from `@adobe/react-spectrum`.
- The component displays the rule identifier as `{country} / {region}` in the confirmation message.
- `Dialog`, `Divider`, `Content`, and `ButtonGroup` were already present in the react-spectrum mock (added by task 003/004), so no mock changes were needed.
- All 5 tests pass. No API calls are made — `onConfirm` and `onCancel` are simply forwarded to the button press handlers.
