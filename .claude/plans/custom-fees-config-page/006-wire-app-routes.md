# Task 006: Wire App.jsx Routes and Clean Up Stale Tests

**Status**: completed
**Depends on**: 001, 003, 004, 005
**Note**: Tasks 004 and 005 already depend on 003, so this task transitively depends on 002 as well.
**Retry count**: 0

## Description

Add the `/custom-fees-config` route to App.jsx so the CustomFeesConfig page renders when the Admin UI SDK navigates to it. Also remove the stale scaffolding assertions from `test/web-src/task-010-verification.test.js` that asserted the new component/test files did not yet exist.

## Context

- **File to update**: `src/commerce-backend-ui-1/web-src/src/App.jsx`
- **New route**: `path="/custom-fees-config"` → renders `<CustomFeesConfig ims={props.ims} />`
- **Existing routes**: Keep index route (ExtensionRegistration) and `/hello-world` route unchanged
- **Stale test file**: `test/web-src/task-010-verification.test.js`
  - Remove the four "does not exist" test cases for RuleList, RuleForm, DeleteConfirm, and api utility files. Note: The RuleList component was renamed to CustomFeesConfig in this plan, so `RuleList.test.jsx` was never created. The assertion is still stale scaffolding and should be removed.
  - Keep the two scaffolding assertions about `ext.config.yaml` (they are still valid)
  - Keep the `@adobe/exc-app` mock existence assertion
- **App.jsx test**: `test/web-src/App.test.jsx` — check if it exists and add a test for the new route if the file is present

## Requirements (Test Descriptions)

- [x] `it renders CustomFeesConfig at the /custom-fees-config route`
- [x] `it still renders HelloWorldPanel at the /hello-world route`
- [x] `it still renders ExtensionRegistration at the index route`
- [x] `it passes the ims prop to CustomFeesConfig`

## Acceptance Criteria

- All requirements have passing tests
- `task-010-verification.test.js` no longer has failing assertions about non-existent files
- All previously passing tests still pass
- Code follows biome.jsonc standards

## Implementation Notes

- Added `CustomFeesConfig` import and `/custom-fees-config` route to `App.jsx`, passing `ims={props.ims}`
- Added `jest.mock` for `CustomFeesConfig` in `App.test.jsx` exposing `data-testid` and `data-ims` attributes for prop verification
- Added 4 new test cases to the `App` describe block in `App.test.jsx`
- Removed `RULE_LIST_TEST_PATH` constant and "RuleList test file does not exist" test from `task-010-verification.test.js`
- All 56 frontend tests pass
