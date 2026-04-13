# Task 004: Create RuleForm Modal Component

**Status**: completed
**Depends on**: 002, 003
**Retry count**: 0

## Description

Create a React Spectrum dialog/modal that contains a form for creating or editing a delivery fee rule. It operates in two modes: create (no initial rule) and edit (pre-filled with an existing rule).

## Context

- **New file**: `src/commerce-backend-ui-1/web-src/src/components/RuleForm.jsx`
- **Props**:
  - `rule` — null for create mode, or an existing rule object `{ country, region, name, type, value }` for edit mode
  - `token` — IMS token string for API calls
  - `onSuccess(savedRule)` — called after successful create or update
  - `onCancel()` — called when user dismisses without saving
- **Fields**: country (text), region (text), name (text), type (text -- no special handling), value (number)
- **Edit mode data**: The `rule` prop is passed from the parent (CustomFeesConfig) which already has the rule data from the list fetch. Do NOT re-fetch the rule from the API -- use the provided prop directly.
- **Validation**: All fields required; value must be a positive number. Show inline field errors.
- **Submit**: Calls `createRule(token, rule)` for create mode, `updateRule(token, rule)` for edit mode (from the api utility)
- **UI library**: `@adobe/react-spectrum` -- use `Dialog`, `DialogContainer`, `Heading`, `Divider`, `Content`, `Form`, `TextField`, `NumberField`, `ButtonGroup`, `Button`
- **React Spectrum mock**: Task 003 will have extended `test/__mocks__/@adobe/react-spectrum.js` with basic component mocks. If any components needed here (e.g., `Dialog`, `Divider`, `Content`, `Form`, `TextField`, `NumberField`, `ButtonGroup`) are not yet in the mock, add them. The mock uses simple `React.createElement` wrappers. `DialogContainer` and `Button` should already exist from the original mock and task 003 respectively.
- **`updateRule` calls the same backend action as `createRule`**: Both use the `rules-create` upsert endpoint. The api utility handles this internally; the component just calls the correct function.
- **Test file**: `test/web-src/components/RuleForm.test.jsx`

## Requirements (Test Descriptions)

- [x] `it renders all form fields: country, region, name, type, value`
- [x] `it pre-fills form fields when a rule is provided (edit mode)`
- [x] `it renders empty fields when no rule is provided (create mode)`
- [x] `it calls createRule when submitted in create mode`
- [x] `it calls updateRule when submitted in edit mode`
- [x] `it calls onSuccess with the saved rule after successful submission`
- [x] `it calls onCancel when the cancel button is clicked`
- [x] `it shows a validation error when a required field is empty`
- [x] `it shows a validation error when value is not a positive number`
- [x] `it disables the submit button while the API call is in progress`

## Acceptance Criteria

- All requirements have passing tests
- Works in both create and edit modes
- Code follows biome.jsonc standards

## Implementation Notes

- Replaced the stub `RuleForm.jsx` with a full implementation using React Spectrum components rendered via `React.createElement`.
- Extended `test/__mocks__/@adobe/react-spectrum.js` to add `Dialog`, `Divider`, `Content`, `Form`, `TextField`, `NumberField`, and `ButtonGroup` mocks. `TextField`/`NumberField` render an `<input>` with `data-testid="field-{label}"` so tests can fire change events.
- Validation runs on submit: all text fields required, value must be > 0. Errors displayed via `errorMessage` prop.
- Submit button uses `isDisabled`/`disabled` during API call to cover both Spectrum and native disabled semantics.
- Updated `test/web-src/task-010-verification.test.js` to expect `RuleForm.test.jsx` and `DeleteConfirm.test.jsx` to exist (both were created by tasks 003 and 004; the original assertions said they should NOT exist which was a pre-task state assumption).
