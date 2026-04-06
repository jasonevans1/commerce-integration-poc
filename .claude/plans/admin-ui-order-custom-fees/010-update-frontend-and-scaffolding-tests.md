# Task 010: Update Frontend and Scaffolding Tests

**Status**: complete
**Depends on**: 004, 005, 008
**Retry count**: 0

## Description

Update frontend component tests and scaffolding tests to reflect the new architecture. Delete obsolete CRUD component test files. Add missing Jest mocks for new dependencies (`@adobe/exc-app`, `core-js`, `regenerator-runtime`).

## Context

- Files to UPDATE:
  - `test/web-src/components/ExtensionRegistration.test.jsx` -- assert plain-function `init()` pattern
  - `test/web-src/App.test.jsx` -- pass mock `runtime` and `ims` props, assert `HashRouter` behavior
  - `test/config/admin-ui-phase2-scaffolding.test.js` -- update `web` field assertion to flat string
  - `test/jest.config.js` -- add `moduleNameMapper` entry for `@adobe/exc-app`
- Files to CREATE:
  - `test/__mocks__/@adobe/exc-app.js` -- mock with `init` (named) and `Runtime` (default) exports
- Files to DELETE:
  - `test/web-src/components/RuleList.test.jsx`
  - `test/web-src/components/RuleForm.test.jsx`
  - `test/web-src/components/DeleteConfirm.test.jsx`
  - `test/web-src/utils/api.test.js`

### Jest mock for @adobe/exc-app

The frontend Jest config (`test/jest.config.js`) has `moduleNameMapper` for `@adobe/react-spectrum` and `@adobe/uix-guest`. Add a similar entry for `@adobe/exc-app` pointing to `test/__mocks__/@adobe/exc-app.js`. The mock should export:

- `init` (named export): `jest.fn()` that calls its callback argument
- `default` export: `jest.fn()` returning `{ on: jest.fn(), done: jest.fn(), solution: null, title: '' }`

### Jest mocks for polyfills

Task 006 adds `import 'core-js/stable'` and `import 'regenerator-runtime/runtime'` to `index.jsx`. These packages are in `web-src/package.json` but not in root `node_modules`. Add `moduleNameMapper` entries in the frontend Jest config to map these to empty modules, OR add them to root `package.json` devDependencies. The simpler approach is moduleNameMapper: `"^core-js/stable$": "<rootDir>/test/__mocks__/empty.js"` and similar for regenerator-runtime (create `test/__mocks__/empty.js` as an empty module).

### ExtensionRegistration test updates

- Remove `GuestConnectionContext` usage from tests
- Test that `register` is called (fire-and-forget pattern)
- Extension ID is `delivery-fee-rules` (NOT `order-custom-fees`)
- No `waitFor` needed for children rendering (component renders nothing)

### App.js test updates

- Pass `runtime={{ on: jest.fn() }}` and `ims={{}}` props to all renders
- Assert `HashRouter` is used (no `BrowserRouter`)
- Remove tests for CRUD routes
- Remove mocks for `RuleList` and `RuleForm` components
- Note: tests resolve `react-router-dom` from root `node_modules` (v7) while runtime uses web-src's v6; both export `HashRouter` with the same API

### Scaffolding test updates

- Change assertion from `extConfig.web.src` equals `'web-src/'` to `extConfig.web` equals `'web-src'`
- Add assertion that `extConfig.actions` equals `'actions'`

## Requirements (Test Descriptions)

- [x] `ExtensionRegistration calls register with id delivery-fee-rules`
- [x] `ExtensionRegistration renders no DOM elements`
- [x] `App renders without crashing with mock runtime prop`
- [x] `App uses HashRouter`
- [x] `scaffolding test asserts ext.config.yaml web is string web-src`
- [x] `scaffolding test asserts ext.config.yaml actions field is string actions`
- [x] `RuleList test file does not exist`
- [x] `RuleForm test file does not exist`
- [x] `DeleteConfirm test file does not exist`
- [x] `api utility test file does not exist`
- [x] `@adobe/exc-app mock exists at test/__mocks__/@adobe/exc-app.js`

## Acceptance Criteria

- All remaining tests pass (`npm test`)
- No references to deleted component test files
- Coverage thresholds maintained
- `@adobe/exc-app` mock is registered in jest.config.js moduleNameMapper
- `npm run code:lint:fix && npm run code:format:fix` produces no errors
