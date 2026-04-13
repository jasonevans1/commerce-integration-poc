# Devil's Advocate Review: hello-world-admin-ui

## Critical (Must fix before building)

### C1: Task 003 does not actually depend on Task 001 (false dependency)

**Affected tasks:** 003

Task 003 lists `[001, 002]` as dependencies. However, task 003 only modifies `App.jsx` to add a route and import `HelloWorldPanel` from task 002. It has zero code dependency on the backend registration action from task 001 -- it does not import, reference, or build upon anything produced by task 001. The dependency on 001 is purely a runtime integration concern, not a build-time one.

Keeping this false dependency means task 003 is artificially blocked. A parallel worker cannot start 003 until 001 completes, even though the only real prerequisite is task 002 (the component to import).

**Fix:** Change task 003 dependencies from `[001, 002]` to `[002]` only.

### C2: Task 001 does not mention existing test file that will break

**Affected tasks:** 001

The existing test file at `test/actions/commerce-backend-ui-1/registration.test.js` asserts the response shape `result.body.registration.order.customFees`. When task 001 adds `massActions` alongside `customFees`, the existing tests will still pass (they only check for `customFees`), but the plan's own test requirement "it includes order.massActions in the registration response" needs the worker to know WHERE to put the new test.

More importantly, the task says "Do NOT remove or alter the existing `order.customFees` logic" but does not reference the existing test file. The worker needs to know the test file exists at `test/actions/commerce-backend-ui-1/registration.test.js` and should add new test cases there, not create a new file.

**Fix:** Add the existing test file path and guidance to task 001 context.

## Important (Should fix before building)

### I1: Task 003 import path uses `.jsx` extension explicitly -- verify Parcel/bundler resolves it

**Affected tasks:** 003

Task 003 specifies importing `HelloWorldPanel` from `./components/HelloWorldPanel.jsx` (with the `.jsx` extension). The existing `App.jsx` imports `ExtensionRegistration` using `./components/ExtensionRegistration.jsx` (also with extension), so this is consistent with the project pattern. No change needed -- just noting this is correct.

### I2: HelloWorldPanel needs a React Spectrum Provider/theme wrapping -- or does it?

**Affected tasks:** 002

Task 002 says to use React Spectrum `Heading`, `View`, `Flex`. These components require a React Spectrum `Provider` ancestor to function (for theming/locale). The `Provider` already wraps `<Routes>` in `App.jsx` (line 18), so any component rendered inside a route will inherit it. This is fine.

However, the task says "Patterns to follow: `src/commerce-backend-ui-1/web-src/src/App.jsx`" which might lead a worker to think they need to add their own `Provider` inside the panel. The task should clarify that `Provider` is already applied by the parent route and should NOT be duplicated.

**Fix:** Add clarifying note to task 002 context that the React Spectrum `Provider` is already set up in `App.jsx` and must not be duplicated in the panel component.

### I3: `ExtensionRegistration.jsx` registers with empty `methods: {}` -- mass action click handler may be needed

**Affected tasks:** 001

The current `ExtensionRegistration.jsx` calls `register({ id: EXTENSION_ID, methods: {} })`. For some Admin UI SDK mass action implementations, the frontend also needs to register methods so the Admin host can communicate with the extension (e.g., to pass selected order IDs to the mass action panel).

For a "Hello World" that just shows a heading, this is likely not needed -- the Admin SDK will simply load the `path` URL in an iframe. But the plan should acknowledge this explicitly so the worker does not wonder whether `ExtensionRegistration.jsx` also needs updating.

**Fix:** Add a note to task 001 that `ExtensionRegistration.jsx` does NOT need changes for this Hello World mass action (the backend registration `path` is sufficient for the SDK to open the panel).

### I4: Task 002 pattern reference points to `App.jsx` but a better reference is `ExtensionRegistration.jsx`

**Affected tasks:** 002

Task 002 says "Patterns to follow: `App.jsx`" but `App.jsx` is a router component, not a panel. The component being created is a simple panel. The existing `ExtensionRegistration.jsx` is a closer pattern for a leaf component in the `components/` directory. However, `ExtensionRegistration.jsx` is also not a great pattern since it has side effects. The task should simply be more explicit about what "follow the pattern" means: use named imports from `@adobe/react-spectrum`, use a default export function component.

**Fix:** Clarify the pattern reference in task 002.

## Minor (Nice to address)

### M1: The `path` value `index.html#/hello-world` assumes the web-src build output filename

The `path: "index.html#/hello-world"` assumes Parcel bundles the SPA entry point as `index.html`. This is correct based on `ext.config.yaml` (`impl: index.html`) and standard App Builder conventions, but if the build output ever changes, the path would break silently. This is a known coupling and acceptable for this simple extension.

### M2: No `key` prop concern for the route, but React Router v6 handles this

The new `<Route>` in task 003 does not need a `key` prop since React Router v6 uses path matching, not array keys. No issue here.

## Questions for the Team

### Q1: Should the Hello World panel use `@adobe/uix-guest`'s `attach()` to connect back to the Admin host?

For a minimal Hello World, the panel just shows static content and does not need to communicate with the Commerce Admin host. However, for any future extension (e.g., receiving selected order IDs from a mass action), the panel would need to call `attach()` from `@adobe/uix-guest`. Should the plan include a placeholder `attach()` call to establish the pattern, or keep it truly minimal?

### Q2: Should the mass action `path` use a `#` hash prefix or not?

The plan uses `index.html#/hello-world`. Some Admin UI SDK documentation examples use `#/hello-world` without the `index.html` prefix (the SDK resolves relative to the extension's web root). Both formats may work, but the plan should confirm which format is correct for this version of the SDK.
