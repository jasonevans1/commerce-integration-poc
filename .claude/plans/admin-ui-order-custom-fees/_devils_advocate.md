# Devil's Advocate Review: admin-ui-order-custom-fees

## Critical (Must fix before building)

### C1. Wrong rule field names in task 001 (task 001, \_plan.md)

The plan and task 001 state that `listRules()` returns `{ country, region, feeType, amount }` and maps `value = rule.amount`. In reality, the rule object fields are `{ country, region, name, type, value }` (confirmed by `actions/delivery-fee/rules-create/validator.js` which validates `country`, `region`, `name`, `type`, and `value`). There is no `feeType` or `amount` field.

The fee mapping must use `rule.value` (not `rule.amount`) for the custom fee `value` field. The `_plan.md` Architecture Notes also reference `rule.amount` and need correction.

**Fix:** Update task 001 and `_plan.md` to reference `rule.value` instead of `rule.amount`, and correct the field list to `{ country, region, name, type, value }`.

### C2. Extension ID mismatch between task 004 and extension-manifest.json (task 004)

Task 004 specifies `id: 'order-custom-fees'` for the `register()` call and states it "matches `extension-manifest.json` id field". However, `extension-manifest.json` has `"id": "delivery-fee-rules"`. Using a different ID will cause the Admin UI SDK to fail to associate the registration with the extension.

Either the task should use `delivery-fee-rules` to match the manifest, or the manifest needs updating too. This needs a decision, but at minimum the task's assertion that it "matches extension-manifest.json" is wrong.

**Fix:** Update task 004 to use `delivery-fee-rules` as the extension ID (matching the manifest), OR add a sub-step to task 004 to also update `extension-manifest.json`. Since the registration action already uses `delivery-fee-rules` and changing it mid-plan adds risk, the safer fix is to keep `delivery-fee-rules`.

### ~C3. Withdrawn~

The `saveRule()` reference was in the user's prompt description, not in the actual `_plan.md`. No fix needed.

## Important (Should fix before building)

### I1. Registration action test mock path may fail (task 001, task 009)

Task 001 specifies the import path as `"../../../../actions/delivery-fee/lib/state-service"`. Task 009 says the mock should be `jest.mock('../../../../actions/delivery-fee/lib/state-service')`. However, the registration test at `test/actions/commerce-backend-ui-1/registration.test.js` requires the action from `"../../../src/commerce-backend-ui-1/actions/registration/index"`.

The jest mock path in the test must match how the _source file_ requires it, which is relative to the source file's location. Since Jest's `jest.mock()` resolves relative to the _test file_, the correct mock path depends on the Jest configuration. The backend project has no `moduleNameMapper` for state-service, so `jest.mock()` must use the path relative to the test file OR use the same string that the source file uses (Jest intercepts the `require()` call by matching the string).

Actually, `jest.mock()` resolves the module path relative to the test file's directory. The source file at `src/commerce-backend-ui-1/actions/registration/index.js` will `require("../../../../actions/delivery-fee/lib/state-service")` which resolves to `<root>/actions/delivery-fee/lib/state-service.js`. The test file at `test/actions/commerce-backend-ui-1/registration.test.js` should mock `../../../actions/delivery-fee/lib/state-service` (3 levels up to root, then into actions/).

The task 009 mock path of `../../../../actions/delivery-fee/lib/state-service` (4 levels) is wrong for the test file location. From `test/actions/commerce-backend-ui-1/`, it's only 3 levels up to root.

**Fix:** Correct the mock path in task 009 to `../../../actions/delivery-fee/lib/state-service`. Also add this mock path detail to task 001 since the test is defined there.

### I2. Task 009 is too large -- combines 4+ test file rewrites and 4+ file deletions (task 009)

Task 009 depends on tasks 001, 004, 005, and 008, and requires updating 4 test files plus deleting 4 test files. This is a lot of work for a single TDD worker, especially since each test file tests completely different concerns (backend action, React component, routing, YAML scaffolding). A worker doing TDD would need to context-switch between Node action testing patterns and React component testing patterns.

Consider splitting into: 009a (registration action tests), 009b (frontend component/App tests + deletions), 009c (scaffolding test updates). At minimum, the registration action test (backend, Node environment) should be separate from the frontend tests (jsdom environment) because they use different Jest projects.

**Fix:** Split task 009 into 009a (registration action tests, depends on 001) and 009b (frontend tests + scaffolding, depends on 004, 005, 008).

### I3. `jest.setup.frontend.js` referenced but no mock for `@adobe/exc-app` (task 006, task 009)

The Jest frontend config has `moduleNameMapper` entries for `@adobe/react-spectrum` and `@adobe/uix-guest`, but NOT for `@adobe/exc-app`. Task 006 introduces `import Runtime, { init } from '@adobe/exc-app'` in `index.jsx`. Without a mock or moduleNameMapper entry, frontend tests that import `index.jsx` or any file that transitively imports `@adobe/exc-app` will fail with a module resolution error.

Task 009 doesn't mention adding a `@adobe/exc-app` mock to `test/__mocks__/@adobe/exc-app.js` or updating `jest.config.js`'s `moduleNameMapper`.

**Fix:** Add a requirement to task 009b (or task 006) to create `test/__mocks__/@adobe/exc-app.js` with mock `init` and default `Runtime` exports, and add it to `moduleNameMapper` in `jest.config.js`.

### I4. `core-js` and `regenerator-runtime` imports in index.jsx will fail in tests (task 006, task 009)

Task 006 adds `import 'core-js/stable'` and `import 'regenerator-runtime/runtime'` to `index.jsx`. These packages are added to `web-src/package.json` (task 003) but are NOT in the root `package.json` devDependencies. Since tests run from the project root using the root `node_modules`, these imports will fail during testing unless the packages are also installed at root level OR mocked in the Jest config.

**Fix:** Add a note to task 003 that `core-js` and `regenerator-runtime` should also be added to the root `package.json` devDependencies, OR add `moduleNameMapper` entries in the Jest config to map them to empty modules. Alternatively, note in task 006 that the test for `index.jsx` should mock these imports.

### I5. Task 004 contradicts itself on file extension (task 004)

The Description says "rename to `ExtensionRegistration.js`" but the Context section later says "Keep the file extension `.jsx` since the project uses JSX throughout". The worker will be confused about which instruction to follow. Since the component renders nothing (no JSX), `.js` could work, but all existing test imports reference `.jsx` and the biome override for filename conventions targets `*.{js,jsx}`.

**Fix:** Remove the ".js rename" instruction. Keep as `.jsx` for consistency.

### I6. Missing dependency: task 008 should also depend on 006 (task 008)

Task 008 deletes CRUD components and utilities, including `config.json` which is "only used by api.js for action URLs". But task 008 depends only on 004 and 005. Task 006 rewrites `index.jsx`, which currently imports from `./App.jsx` which imports RuleList/RuleForm. If task 008 runs before task 005 completes (which removes those imports from App.jsx), the deletion would leave dangling imports. This is already handled by depending on 005. However, task 008's requirement to "verify no remaining imports reference these files" needs task 006 to have completed too, since the old `index.jsx` imports `BrowserRouter` and `App` (which formerly imported CRUD components).

Actually, since task 005 already updates App.jsx to remove CRUD imports, and task 008 depends on 005, this is technically covered. No change needed. Withdrawing this finding.

### I7. `react-router-dom` version mismatch between test and runtime (task 005, task 009)

The root `package.json` has `"react-router-dom": "^7.14.0"` in devDependencies. The `web-src/package.json` has `"react-router-dom": "^6.28.0"`. Jest tests resolve modules from root `node_modules` (since `rootDir` is project root and web-src is not a workspace). This means tests will import `HashRouter` from react-router-dom v7, while the deployed app uses v6.

Both v6 and v7 export `HashRouter` with the same API, so this likely won't cause test failures. But if any v7-only behavior is used accidentally, it would pass tests but fail at runtime. The plan should at least document this discrepancy.

**Fix:** Add a note to task 005 about this version mismatch and recommend testing against the same version (either update web-src to v7 or pin root to v6).

## Minor (Nice to address)

### M1. No `config.json` deletion in test requirements for task 008

Task 008 lists `config.json` for deletion in the Context section but has no corresponding test requirement. Consider adding `config.json does not exist` to the requirements.

### M2. `test-coverage/` HTML files reference deleted components

There are HTML coverage report files like `test/test-coverage/RuleList.jsx.html` that will become stale after the migration. These are generated artifacts and won't cause failures, but they'll be confusing. Consider adding them to `.gitignore` or deleting them as part of task 008.

### M3. The `exc-runtime.js` content is described as "copy verbatim from sample" but no content is provided

Task 006 says to copy `exc-runtime.js` "verbatim from sample" but doesn't include the actual content or a URL to the sample file. A worker would need to find the Adobe Commerce samples repo and locate the correct file. Including the content directly in the task (or a precise URL/commit hash) would be more reliable.

### M4. Task 002 tests are structural, not behavioral

Task 002's tests read and parse the YAML file. These are essentially the same tests already in `admin-ui-phase2-scaffolding.test.js` (task 009). Consider whether task 002 needs its own test file or if updating the scaffolding test (in task 009) is sufficient.

## Questions for the Team

### Q1. Should the extension ID change from `delivery-fee-rules` to `order-custom-fees`?

Task 004 uses `order-custom-fees` but the existing `extension-manifest.json` uses `delivery-fee-rules`. Is the plan intentionally changing the extension ID (which would also require updating the manifest, install.yaml, and possibly the Adobe Developer Console registration)? Or should it stay as `delivery-fee-rules`?

### Q2. Is downgrading `@adobe/uix-guest` from `1.0.3` to `^0.8.3` correct?

Task 003 downgrades `@adobe/uix-guest` to match the official sample. However, the official sample may be outdated. Has anyone verified that `^0.8.3` is the correct version for the `order.customFees` extension point, or would `1.0.3` (or newer) work?

### Q3. Should `window.React = require('react')` be used with React 18?

Task 006 includes `window.React = require('react')` which is a legacy pattern from React 16/17 needed by some ECS iframe integration code. With React 18 and automatic JSX runtime, this may not be necessary. However, if the ECS shell iframe code depends on `window.React`, removing it would break things. Worth verifying with the latest ECS documentation.

### Q4. Will the registration action's I/O State call affect cold-start latency?

The current registration action is synchronous and returns a static payload. Making it async with an `await stateService.listRules()` call (which initializes `@adobe/aio-lib-state` and does N+1 fetches for each rule key) adds latency to every registration call. If Commerce calls the registration endpoint frequently, this could cause noticeable delays. Consider whether to cache the result or accept the latency trade-off.
