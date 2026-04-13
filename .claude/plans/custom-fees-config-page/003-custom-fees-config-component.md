# Task 003: Create CustomFeesConfig Table Page Component

**Status**: completed
**Depends on**: 002
**Retry count**: 0

## Description

Create the main configuration page component that renders a React Spectrum table of all delivery fee rules. The component handles loading, error, and empty states, and provides entry points for create, edit, and delete operations via callback props or internal state (your choice — keep it simple).

## Context

- **New file**: `src/commerce-backend-ui-1/web-src/src/components/CustomFeesConfig.jsx`
- **Props**: `ims` (object with `token` string) -- passed from App.jsx
- **UI library**: `@adobe/react-spectrum` -- use `TableView`, `Column`, `Row`, `Cell`, `ActionButton`, `Button`, `Flex`, `View`, `Heading`, `ProgressCircle`, `Text` as needed
- **React Spectrum mock -- MUST EXTEND**: The existing mock at `test/__mocks__/@adobe/react-spectrum.js` only exports `DialogContainer`, `AlertDialog`, `Provider`, `lightTheme`. You MUST add mock implementations for every Spectrum component this task uses (e.g., `TableView`, `Column`, `Row`, `Cell`, `ActionButton`, `Button`, `Flex`, `View`, `Heading`, `ProgressCircle`, `Text`). Use simple `React.createElement('div', ...)` wrappers that render children and pass through relevant props (like `onClick`). Without this, tests will fail because the jest `moduleNameMapper` redirects all `@adobe/react-spectrum` imports to this mock file.
- **Table columns**: Country, Region, Name, Type, Value, Actions (Edit / Delete buttons per row)
- **"Add Rule" button**: Opens RuleForm modal with no initial rule (create mode)
- **Edit button per row**: Opens RuleForm modal with the selected rule (edit mode)
- **Delete button per row**: Opens DeleteConfirm dialog with the selected rule
- **After any CUD**: Re-fetch rules from the API and refresh the table
- **API calls**: Use the utility from task 002 -- pass `ims.token`
- **RuleForm and DeleteConfirm**: Import them (they are created in tasks 004 and 005). In tests, mock both components with `jest.mock` (e.g., `jest.mock('../../../src/commerce-backend-ui-1/web-src/src/components/RuleForm', () => (props) => <div data-testid="rule-form" />)`) since they may not exist yet when this task is built. In the component source, import them normally.
- **RuleForm expected props**: `rule` (null for create, object for edit), `token` (string), `onSuccess(savedRule)`, `onCancel()`
- **DeleteConfirm expected props**: `rule` (object), `onConfirm()`, `onCancel()`
- **Test file**: `test/web-src/components/CustomFeesConfig.test.jsx`
- **Mock pattern**: Follow `test/web-src/components/ExtensionRegistration.test.jsx` for mock setup

## Requirements (Test Descriptions)

- [x] `it renders a loading indicator while fetching rules`
- [x] `it renders the table with rule rows after successful fetch`
- [x] `it renders an empty state message when no rules exist`
- [x] `it renders an error message when the API call fails`
- [x] `it renders an Add Rule button`
- [x] `it opens the RuleForm modal when Add Rule is clicked`
- [x] `it opens the RuleForm modal in edit mode when an Edit button is clicked`
- [x] `it opens the DeleteConfirm dialog when a Delete button is clicked`
- [x] `it refreshes the rule list after RuleForm is submitted`
- [x] `it refreshes the rule list after a rule is deleted`

## Acceptance Criteria

- All requirements have passing tests
- Component renders correctly in jsdom (React Testing Library)
- `@adobe/react-spectrum` mocked via `test/__mocks__/@adobe/react-spectrum.js`
- Code follows biome.jsonc standards

## Implementation Notes

- Created `CustomFeesConfig.jsx` with loading/error/empty/table states using React Spectrum components
- Extended `test/__mocks__/@adobe/react-spectrum.js` with: `TableView`, `TableHeader`, `TableBody`, `Column`, `Row`, `Cell`, `ActionButton`, `Button`, `Flex`, `View`, `Heading`, `ProgressCircle`, `Text`
- Created stub files `RuleForm.jsx` and `DeleteConfirm.jsx` (required by jest.mock to resolve the module path before mocking)
- Updated `test/config/admin-ui-phase2-scaffolding.test.js` to reflect that RuleForm.jsx and DeleteConfirm.jsx now exist (scaffolding assertions were pre-implementation guards)
- Component uses `useCallback` + `useEffect` for initial fetch and re-fetch after CUD operations
- Internal state: `showForm`, `editingRule`, `deletingRule`, `fetchState`
