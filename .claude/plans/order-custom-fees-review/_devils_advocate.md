# Devil's Advocate Review: order-custom-fees-review

## Critical (Must fix before building)

### C1. Task 002 misidentifies the ExtensionRegistration duplicate pair (affects task 002)

The plan states that `"calls register on mount"` and `"calls register with id delivery-fee-rules"` are duplicates, calling the second "a strict subset of the first." This is wrong.

Actual code:

- `"calls register on mount"` (line 22) asserts `toHaveBeenCalledTimes(1)` -- tests call count only
- `"calls register with the correct extension id delivery-fee-rules"` (line 30) asserts `objectContaining({ id: EXTENSION_ID })` -- tests the id
- `"calls register with id delivery-fee-rules"` (line 50) asserts `objectContaining({ id: EXTENSION_ID })` -- tests the id (identical to line 30)

The actual duplicate pair is lines 30 and 50 -- they have identical assertions. `"calls register on mount"` tests something different (call count) and must be kept. Following the plan as written would either merge two non-duplicate tests or lose the call-count assertion.

**Fix:** Update task 002 to correctly identify the duplicate pair as `"calls register with the correct extension id delivery-fee-rules"` and `"calls register with id delivery-fee-rules"`. Keep `"calls register on mount"` untouched, and keep one of the two id-checking tests.

### C2. The MemoryRouter approach for testing `/hello-world` route won't work (affects task 002)

The plan suggests: "Use `MemoryRouter` with `initialEntries={["/hello-world"]}` instead of `HashRouter`."

But `App.jsx` renders its own `<HashRouter>` internally (line 18). If the test renders `<App>` wrapped in a `MemoryRouter`, the inner `HashRouter` will ignore the outer router's location. React Router does not propagate location context through nested router boundaries. The `HashRouter` will always start at `/`, so `/hello-world` will never be reached.

The correct approach is one of:

1. Mock `react-router-dom` to replace `HashRouter` with `MemoryRouter` so the component uses the test-controlled router
2. Use `window.location.hash` manipulation before rendering (set `window.location.hash = "#/hello-world"`)
3. Use `jest.resetModules()` + re-require pattern (like the error boundary test at line 62 of App.test.jsx) combined with a `HashRouter` mock

**Fix:** Update task 002 guidance to specify approach (1) or (2), and explicitly warn against wrapping `<App>` in a second router.

## Important (Should fix before building)

### I1. Task 001 does not enumerate all test assertions that reference the old fee ID (affects task 001)

The registration test file has TWO assertions that use the old `"delivery-fee-us-ca"` format:

- Line 67: `expect(result.body.registration.order.customFees[0].id).toBe("delivery-fee-us-ca")`
- Line 151: `expect(order.customFees[0].id).toBe("delivery-fee-us-ca")`

The task says "update `id` assertions only" but doesn't list the specific test names or line locations. A worker might update the obvious one (line 67, in the test named `"constructs the fee id as..."`) and miss line 151 (in `"still returns order.customFees alongside the new massActions"`).

**Fix:** Explicitly list both test cases that need id assertion updates in task 001.

### I2. Task 001 test description should match the new format (affects task 001)

The existing test is named `"constructs the fee id as delivery-fee-{country}-{region} in lowercase"`. After the code change, this description becomes misleading. The task's requirements list `"it constructs the fee id as delivery-fee-rules::us-ca format"` but does not mention renaming the existing test -- only adding new assertions. The worker needs to know to rename the existing test, not add a new one alongside it.

**Fix:** Clarify that the existing test description at line 55 should be renamed, not that a new test should be added.

### I3. Task 002 duplicate count math is wrong (affects task 002)

The acceptance criteria says "~4 removed + 1 added = net -3". Actual duplicate count:

- ExtensionRegistration: 2 duplicates to remove (lines 50 and 60)
- App.test.jsx: 2 duplicates to remove (lines 17 and 21)
- New test: +1

That is 4 removed + 1 added = net -3. The math is actually correct, but only if the plan removes the right tests per the fix in C1.

## Minor (Nice to address)

### M1. The `"uses HashRouter"` tests are fragile

Both the original and kept `"uses HashRouter not BrowserRouter"` test uses `require().toString()` on the module and checks for the string `BrowserRouter`. This is brittle -- it tests the module's string representation, not actual behavior. A bundler change, minification, or tree-shaking could break this. However, this is a pre-existing issue, not introduced by this plan, so it is informational only.

### M2. No standalone HelloWorldPanel test file exists

There is no `test/web-src/components/HelloWorldPanel.test.jsx`. The plan is adding a route-level test in App.test.jsx, which is good, but the component itself has zero unit test coverage. This is outside the plan's scope but worth noting.

## Questions for the Team

### Q1. Should the existing test name for the fee id format be updated or should a new test be written?

Task 001's requirements list two new test descriptions. The existing test `"constructs the fee id as delivery-fee-{country}-{region} in lowercase"` will need its assertion updated regardless. Should the worker rename this existing test to match the new format, or write a brand new test and delete the old one? (I have applied an assumption of "rename" in my fixes.)
