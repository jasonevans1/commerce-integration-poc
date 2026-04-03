# Devil's Advocate Review: admin-ui-phase2

## Critical (Must fix before building)

### C1. `app.config.yaml` uses `application.runtimeManifest` not `extensions` -- wrong config structure (Task 001)

The existing `app.config.yaml` uses the `application.runtimeManifest.packages` structure for backend actions. However, the Admin UI SDK (`commerce/backend-ui/1`) requires a top-level `extensions` block, NOT an entry under `application.runtimeManifest.packages`. The App Builder config format for extensions is:

```yaml
extensions:
  commerce/backend-ui/1:
    $include: src/commerce-backend-ui-1/ext.config.yaml
```

Task 001 says "app.config.yaml includes the commerce/backend-ui/1 extension via ext.config.yaml" but does not specify that this goes in an `extensions` block (which does not currently exist in the file). A worker could incorrectly add it as another package under `application.runtimeManifest.packages`, which will not work.

**Fix:** Add explicit instructions to Task 001 specifying the `extensions` top-level block structure and that `ext.config.yaml` must use the extension-specific format (`operations`, `web`, `runtimeManifest` keys).

### C2. Registration action auth is handled by the runtime, not the action code (Task 002)

Task 002 requires tests for "returns 401 when the Authorization header is missing" and "returns 401 when the Authorization header contains an invalid token." However, when `require-adobe-auth: true` is set in the config, the App Builder runtime itself rejects unauthenticated requests before the action code runs. The action code never sees unauthenticated requests. Writing auth validation logic inside `index.js` is unnecessary and writing tests for 401 responses from the action function is testing the wrong thing.

**Fix:** Remove the two 401 test requirements from Task 002. Add a note that auth is enforced by the runtime via `require-adobe-auth: true` and the action does not need to implement auth checking.

### C3. Jest config `collectCoverageFrom` only covers `actions/`, `onboarding/`, `utils/` -- new SPA code in `src/` will break coverage thresholds (Task 003)

The existing `test/jest.config.js` has `collectCoverageFrom: ["../actions/**/*.js", "../onboarding/**/*.js", "../utils/**/*.js"]`. It does NOT cover `src/`. If frontend test files are added to the `test/` directory but the source files under `src/commerce-backend-ui-1/web-src/` are not in `collectCoverageFrom`, coverage collection will be wrong. Additionally, running jsdom tests through the same config with the same coverage thresholds (80% lines, 65% branches) could cause failures because the new frontend code won't be counted.

**Fix:** Task 003 must specify that the jsdom jest project uses its own `collectCoverageFrom` targeting `src/commerce-backend-ui-1/web-src/src/**/*.{js,jsx}` and its own coverage thresholds (or none initially). The node project config must remain unchanged.

### C4. `npm test` command hardcodes `./test` directory -- frontend tests under `src/` won't run (Task 003)

The `package.json` test script is: `jest --passWithNoTests -c ./test/jest.config.js ./test`. This restricts test file discovery to the `./test` directory. If the worker places frontend test files under `src/commerce-backend-ui-1/web-src/` or `test/web-src/`, they must match this path or the script must be updated. Task 003 mentions "add a jest.projects array" but does not address the test script path constraint.

**Fix:** Add explicit guidance to Task 003 that either (a) frontend test files must live under `test/` (e.g., `test/web-src/`), or (b) the `npm test` script must be updated to remove the `./test` path restriction when using jest projects.

## Important (Should fix before building)

### I1. Task 002 depends on Task 001 but declares no dependency

Task 002 says "Depends on: none" but its acceptance criteria state "Action is referenced correctly in `ext.config.yaml` (Task 001)." The registration action file lives at `src/commerce-backend-ui-1/actions/registration/index.js`, which is a path created/defined by Task 001's `ext.config.yaml`. A worker building Task 002 in parallel with Task 001 won't know the exact path convention or whether the directory exists.

**Fix:** Add Task 001 as a dependency for Task 002.

### I2. `api.js` action URL env var naming convention not specified (Task 003)

Task 003 says "Action URLs are read from `process.env.ACTION_<NAME>_URL`" but does not specify the exact env var names. App Builder injects action URLs with a specific naming convention based on the package name and action name from `app.config.yaml`. For the existing actions under the `delivery-fee` package, the env vars would be something like `ACTION_DELIVERY_FEE_RULES_LIST_URL`, not `ACTION_RULES_LIST_URL`. The worker needs to know the exact names or know how to derive them.

**Fix:** Add the expected env var names to Task 003 context, or specify that the worker must check the App Builder docs/build output for the exact naming convention. List the likely names based on the `delivery-fee` package name.

### I3. Task 007 missing validation for `percentage` type max value (Task 007)

The server-side `rules-create/validator.js` enforces that percentage values must not exceed 100 (`numValue > MAX_PERCENTAGE`). Task 007's requirements list validation for "value is not a positive number" but do not mention the percentage cap. The acceptance criteria say "Client-side validation mirrors the server-side rules" but the test list is incomplete.

**Fix:** Add a test requirement to Task 007: "it shows a validation error when type is percentage and value exceeds 100."

### I4. Task 007 missing validation for `type` field (Task 007)

The server-side validator checks `params.type !== "fixed" && params.type !== "percentage"`. Task 007 lists a "type" field as a select with `fixed | percentage` but has no validation test for it. While a select/picker UI may prevent invalid values, the validation mirror should still be tested.

**Fix:** Add a test requirement to Task 007: "it shows a validation error when type is not selected."

### I5. RuleList needs IMS token access pattern defined (Task 006)

Task 006 says "Reads the IMS token from `@adobe/uix-guest` `sharedContext.imsToken`" but does not specify the API for doing so. The `@adobe/uix-guest` library provides the token through `register()` in `ExtensionRegistration`, and child components typically access it via `useExtensionApi()` or a context/prop drill. The plan does not define how the IMS token flows from `ExtensionRegistration` (Task 004) to `RuleList` (Task 006) and `RuleForm` (Task 007). Workers building tasks 004, 006, and 007 independently will each invent their own approach.

**Fix:** Add a note to Task 003 (api.js) or Task 004 (ExtensionRegistration) specifying the pattern for IMS token access. Either: (a) `ExtensionRegistration` provides a React context with the token, or (b) each component calls `useExtensionApi()` from `@adobe/uix-guest` to get `sharedContext`. Specify which pattern and add it as a shared contract.

### I6. Biome linting has no override for `src/` or JSX files (All tasks)

The `biome.jsonc` has overrides for `scripts/**/*.js` and `actions/**/*.js` but none for `src/**/*.jsx`. Biome's default rules will apply, including `noConsole` (which is `error` by default in ultracite). React Spectrum components and development debugging may hit this. Workers should be aware.

**Fix:** Add a note to Task 001 that a Biome override for `src/**/*.{js,jsx}` may be needed, and the worker should verify lint compliance after scaffolding.

### I7. `web-src/package.json` as separate sub-project vs root dependencies (Task 001, 003)

Task 001 says "web-src/package.json must declare React..." and Task 003 says to add `jest-environment-jsdom` and testing-library as devDependencies. But the project uses npm workspaces (`"workspaces": {"packages": ["packages/*"]}`). The `src/commerce-backend-ui-1/web-src/` directory is NOT under `packages/`, so it won't be auto-installed as a workspace. The plan needs to clarify: should `web-src` be added to the workspaces config, or should a separate `npm install` be run in that directory, or should the test dependencies go in the root `package.json`?

**Fix:** Add explicit guidance to Task 001 and Task 003 about how dependencies are managed. Recommended approach: add test dependencies (`jest-environment-jsdom`, `@testing-library/*`) to root `devDependencies` since Jest runs from root, and let App Builder handle `web-src/package.json` dependencies during `aio app build/deploy`.

## Minor (Nice to address)

### M1. `index.html` entry point may need a `<script>` tag for the bundled JS

Task 001 requires "index.html has a root div with id root for React mounting" but does not mention the script tag. App Builder's web-src build (Parcel or webpack) typically auto-injects it, but this should be verified. If the builder does not auto-inject, the SPA won't load.

### M2. Task 008 could be merged with Task 004

Task 008 (App.jsx router) is a thin file that just imports components and declares routes. It depends on all other UI tasks and has only 5 test requirements. Task 004 (ExtensionRegistration) is similarly small. These could be a single task, reducing coordination overhead.

### M3. No loading/error boundary at the App level

The plan has loading and error states in individual components (RuleList, RuleForm) but no top-level error boundary. If `ExtensionRegistration` fails or the SDK host is unreachable, the user sees a blank iframe with no feedback.

### M4. No `index.js` entry point for ReactDOM rendering

Task 008 mentions "App is exported as default and mounted from `index.html`" but no task creates the `index.js` (or `main.jsx`) file that calls `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`. This bootstrapping file needs to exist somewhere.

## Questions for the Team

1. **Should `web-src` testing dependencies live in root `package.json` or in `web-src/package.json`?** The current workspace config only covers `packages/*`, not `src/`. This affects how CI installs dependencies.

2. **What is the exact `@adobe/uix-guest` API version being targeted?** The registration API (`register()` vs `extensionPoint.init()`) varies between versions. This affects Tasks 004, 006, and 007.

3. **Are the Phase 1 rule actions deployed and accessible by URL from the SPA origin?** The SPA will be served from a different domain than the actions. CORS headers must allow the SPA origin, or the actions must be invoked through the App Builder proxy. The plan does not address CORS.

4. **Should `App.jsx` use `HashRouter` instead of `BrowserRouter`?** Admin UI SDK iframes often work better with hash routing since the parent frame controls the URL bar. This affects Task 008.
