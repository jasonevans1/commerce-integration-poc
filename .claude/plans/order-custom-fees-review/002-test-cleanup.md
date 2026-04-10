---
name: 002-test-cleanup
description: Remove duplicate tests and add missing /hello-world route coverage in App.test.jsx
type: project
---

# Task 002: Fix Duplicate Tests and Add /hello-world Route Coverage

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Remove duplicate test cases in `ExtensionRegistration.test.jsx` and `App.test.jsx` that were introduced during the previous TDD cycles. Also add a test for the `/hello-world` route in `App.test.jsx` — the route was added by the hello-world plan but never covered by routing integration tests.

## Context

- **Files to modify**:
  - `test/web-src/components/ExtensionRegistration.test.jsx`
  - `test/web-src/App.test.jsx`
- **Existing test file for HelloWorldPanel**: `test/web-src/` — check if a standalone HelloWorldPanel test exists

### Duplicates in `ExtensionRegistration.test.jsx`

These pairs test the same behaviour and should be collapsed to one:

- `"calls register with the correct extension id delivery-fee-rules"` (line 30) and `"calls register with id delivery-fee-rules"` (line 50) — identical assertions; remove `"calls register with id delivery-fee-rules"` (line 50). **Do NOT remove `"calls register on mount"` (line 22) — it tests call count, not the id, and is not a duplicate.**
- `"renders no DOM elements"` (line 60) and `"does not render any DOM elements"` (line 68) — identical; remove `"renders no DOM elements"` (line 60), keep `"does not render any DOM elements"` (line 68)

### Duplicates in `App.test.jsx`

- `"renders without crashing with mock runtime prop"` and `"renders without crashing given a mock runtime prop"` — identical; keep the second (more grammatically correct)
- `"uses HashRouter"` and `"uses HashRouter not BrowserRouter"` — identical assertion; keep `"uses HashRouter not BrowserRouter"`

### Missing test in `App.test.jsx`

The `/hello-world` route was added to `App.jsx` in the hello-world plan but `App.test.jsx` only tests the index route (`ExtensionRegistration`). Add a test that verifies the `/hello-world` route renders `HelloWorldPanel`.

- **How to test the `/hello-world` route**: You CANNOT wrap `<App>` in a `MemoryRouter` because `App.jsx` renders its own `<HashRouter>` internally — nested routers do not share location context. Instead, use one of these approaches:
  - **(Recommended)** Set `window.location.hash = "#/hello-world"` before rendering `<App>`, then clean up with `window.location.hash = ""` in afterEach. The internal `HashRouter` reads from `window.location.hash`.
  - **(Alternative)** Mock `react-router-dom` to replace `HashRouter` with `MemoryRouter` so the test controls the router. This is more invasive and may affect other tests in the same file.
- **Pattern to follow**: Use `jest.resetModules()` + fresh require (like the existing error boundary test at line 62 of App.test.jsx) to get a clean App instance after setting `window.location.hash`.
- Mock `HelloWorldPanel` similar to how `ExtensionRegistration` is mocked: `jest.mock('...HelloWorldPanel', () => () => <div data-testid="hello-world-panel" />)`. Add this mock at the top of the file alongside the existing `ExtensionRegistration` mock.
- **Important**: Remember to reset `window.location.hash` in `afterEach` to avoid leaking state to other tests.

## Requirements (Test Descriptions)

- [ ] `it renders HelloWorldPanel at the /hello-world route`
- [ ] `ExtensionRegistration.test.jsx has no duplicate test cases`
- [ ] `App.test.jsx has no duplicate test cases`

## Acceptance Criteria

- No duplicate `it(...)` descriptions within each test file
- `App.test.jsx` has a test that renders `HelloWorldPanel` when the route is `/hello-world`
- Total test count does not decrease by more than the number of removed duplicates (should be ~4 removed + 1 added = net -3)
- All remaining tests still pass
- Code passes lint and format checks

## Implementation Notes

(Left blank — filled in by programmer during implementation)
