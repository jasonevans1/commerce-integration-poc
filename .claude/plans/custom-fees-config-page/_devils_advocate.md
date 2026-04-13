# Devil's Advocate Review: custom-fees-config-page

## Critical (Must fix before building)

### C1. config.json does NOT contain delivery-fee action URLs (Task 002)

Task 002 says to import `config.json` and read keys like `delivery-fee/rules-list`. However, the actual `config.json` at `src/commerce-backend-ui-1/web-src/src/config.json` only contains keys for the **extension's own actions** (the `admin-ui-sdk` package):

```json
{ "registration": "https://...", "admin-ui-sdk/registration": "https://..." }
```

The delivery-fee actions live in the **root application** under `app.config.yaml > runtimeManifest > packages > delivery-fee`, NOT under the `commerce/backend-ui/1` extension. App Builder's config.json auto-generation is scoped to the extension's own package. The delivery-fee URLs will NOT appear in this config.json.

The prior plan (`admin-ui-phase2/003`) noted that action URL env vars like `REACT_APP_ACTION_DELIVERY_FEE_RULES_LIST` might be injected, but explicitly warned: "The worker MUST verify the exact naming convention... Do NOT guess."

**Fix:** Task 002 must NOT assume config.json contains delivery-fee keys. The API utility needs to resolve action URLs either via environment variables injected by `aio app build` (verify naming) or by constructing them from a known base URL pattern. The task must instruct the worker to determine the correct mechanism.

### C2. React Spectrum mock is incomplete -- only exports 4 components (Tasks 003, 004, 005)

The `@adobe/react-spectrum` mock at `test/__mocks__/@adobe/react-spectrum.js` only exports: `DialogContainer`, `AlertDialog`, `Provider`, `lightTheme`.

Tasks 003, 004, and 005 require many more components: `TableView`, `Column`, `Row`, `Cell`, `ActionButton`, `Button`, `Flex`, `View`, `Heading`, `ProgressCircle`, `Text`, `Dialog`, `Divider`, `Content`, `Form`, `TextField`, `NumberField`, `ButtonGroup`. None of these are in the mock.

Because the jest config uses `moduleNameMapper` to point `@adobe/react-spectrum` to this mock file, any import of these components will be `undefined` and tests will fail with cryptic errors.

**Fix:** Each task (003, 004, 005) must note the requirement to extend the react-spectrum mock with the components it uses. Task 003 runs first (or in parallel with 004/005), so all three need this note. Alternatively, add a pre-task or make extending the mock part of task 003 with 004/005 depending on it.

### C3. Verification test asserts `RuleList.test.jsx` does NOT exist, but plan creates `CustomFeesConfig.test.jsx` (Task 006)

The `task-010-verification.test.js` (line 47-49) asserts `test/web-src/components/RuleList.test.jsx` does NOT exist. The plan creates `CustomFeesConfig.test.jsx` instead (the component was renamed from RuleList to CustomFeesConfig). This means the `RuleList.test.jsx` assertion will still PASS after the plan completes (because that file is never created).

Task 006 says "Remove the four 'does not exist' test cases for RuleList, RuleForm, DeleteConfirm, and api utility files." But only three of those four will actually be invalidated by the plan (RuleForm, DeleteConfirm, api). The RuleList one stays technically correct but is stale/confusing.

Additionally, the plan creates `CustomFeesConfig.test.jsx`, not `RuleList.test.jsx`. If any future task expects `RuleList.test.jsx` to exist, it will fail.

**Fix:** Task 006 should still remove ALL four assertions as planned (including RuleList), since they are all stale scaffolding that served their verification purpose. This is already correct in the plan, but the task description should note the rename from RuleList to CustomFeesConfig to avoid confusion.

## Important (Should fix before building)

### I1. Backend actions are `require-adobe-auth: true` but frontend uses IMS Bearer token (Task 002)

The delivery-fee actions have `require-adobe-auth: true` + `final: true` in `actions.config.yaml`. This means App Builder runtime validates the token as an Adobe IMS token. The plan says to pass `Authorization: Bearer {token}` using `props.ims.token` from the SPA.

This SHOULD work because the Admin UI SDK SPA receives a valid IMS token from the Commerce Admin shell. However, the `final: true` annotation means no additional parameters can be passed via the runtime. The token must be sent as a standard `Authorization: Bearer` header, and the runtime will validate it. This is the correct pattern, but task 002 should explicitly note that these are web actions (`web: 'yes'`) with Adobe auth, so the correct header is `Authorization: Bearer {imsToken}` and additionally `x-gw-ims-org-id` may be required. The worker should verify whether `x-gw-ims-org-id` is needed for cross-package action calls.

**Fix:** Add a note to task 002 about verifying whether `x-gw-ims-org-id` header is required alongside the Bearer token for `require-adobe-auth: true` web actions.

### I2. No `updateRule` backend action exists -- `rules-create` is an upsert (Task 002, 004)

Task 002 defines `updateRule(token, rule)` as a separate export, and task 004 says "it calls updateRule when submitted in edit mode." But the backend only has `rules-create` which is described as "Creates or updates a delivery fee rule" (an upsert by country+region). There is no separate `rules-update` action.

The plan acknowledges this somewhat (task 002 context says "POST create or update a rule (upsert by country+region)"), but then defines `updateRule` as a separate function that calls the same endpoint. This is fine architecturally, but the task should make explicit that `updateRule` calls the same `rules-create` URL as `createRule` -- otherwise a worker might look for a `rules-update` config key.

**Fix:** Task 002 must explicitly state that `updateRule` calls the same `rules-create` action URL as `createRule`, since the backend performs an upsert.

### I3. No `rules-get` usage in the API utility (Task 002)

The backend has a `rules-get` action for fetching a single rule, and the prior plan's api.js exported `getRule(imsToken, country, region)`. The current plan's task 002 does not include `getRule` in its exports. This is fine if the edit modal just uses the already-fetched rule data from the table, but if the worker decides to re-fetch on edit, they will need it.

**Fix:** Note in task 004 that edit mode should use the rule object already available in parent state, not re-fetch. If re-fetching is desired later, `getRule` can be added to the API utility.

### I4. HTTP methods may be wrong for web actions (Task 002)

Task 002 says "call them with POST for mutations, GET for reads." But App Builder web actions with `web: 'yes'` receive ALL HTTP methods. The actual method handling depends on the action implementation. Looking at the `rules-list` action, it takes `params` and calls `sendData()` with no body -- suggesting it works as a GET/POST with no body. The `rules-create` action reads fields from `params` (which for web actions, body fields are merged into params). The `rules-delete` action reads `country` and `region` from params.

For web actions, POST with JSON body is the safest bet for mutations since query params and body fields both merge into `params`. For deletes, the country/region could go as query params or POST body. The task should be explicit about which approach to use.

**Fix:** Clarify in task 002 that all actions should be called via POST with JSON body (for create/update) or POST with body containing country/region (for delete), since App Builder web actions merge all inputs into `params`. For list, either GET or POST with no body works.

### I5. Parallel workers building tasks 003, 004, 005 will conflict on react-spectrum mock (Tasks 003, 004, 005)

Tasks 003, 004, and 005 can theoretically run in parallel (003 depends on 002; 004 depends on 002; 005 depends on nothing). All three need to extend the react-spectrum mock with different components. If built by parallel workers, they will each modify the same mock file and create merge conflicts.

**Fix:** Make tasks 004 and 005 depend on 003 (serializing mock modifications), OR create a new task 002.5 that pre-extends the react-spectrum mock with all needed components, and make 003, 004, 005 depend on it.

### I6. Task 006 depends on 004 but 004 does not export a consistent interface for 003 (Tasks 003, 004)

Task 003 imports RuleForm and DeleteConfirm (from tasks 004 and 005). The plan says "During TDD write the component assuming they exist and accept reasonable props." But there is no shared interface contract documented. Task 003 assumes certain props on RuleForm (`rule`, `token`, `onSuccess`, `onCancel`), and task 004 defines exactly those props. This is OK because the plan documents them in both tasks. However, task 003's worker will need to mock these components. The mocking approach should be specified.

**Fix:** Task 003 should explicitly state that RuleForm and DeleteConfirm should be mocked in tests (e.g., `jest.mock('../path/to/RuleForm', () => ...)`) since they may not exist yet when task 003 is built.

## Minor (Nice to address)

### M1. The plan mentions `rules-get` in the config key list but never uses it

Task 002 context says the config keys include `delivery-fee/rules-get` but none of the tasks use it. This is confusing -- either remove it from the context or add a `getRule` export.

### M2. No loading/error state in RuleForm during API submission

Task 004 has "it disables the submit button while the API call is in progress" but no test for displaying an error if the create/update API call fails. The user would see no feedback if the save fails silently.

### M3. The registration action is a backend Node.js action, not a client-side registration

Task 001 context is clear, but the term "Admin UI SDK registration" could confuse a worker. The registration action is a server-side OpenWhisk action that returns JSON. It is NOT the client-side `register()` call in `ExtensionRegistration.jsx`. The plan should make this distinction more explicit.

### M4. `value` field is described as "number" but rule type could be "percentage" vs "fixed"

The plan says "type: text -- no special handling" but if type is "percentage", the value might need different validation (0-100 range). This is explicitly out of scope, which is fine.

## Questions for the Team

1. **How does the SPA access delivery-fee action URLs?** Since config.json only contains the extension's own action URLs, how should the frontend resolve URLs for actions in a different package? Options: (a) environment variables injected at build time, (b) hardcode the URL pattern with the namespace, (c) move the delivery-fee actions into the extension package. This is a fundamental architectural question that blocks task 002.

2. **Is `x-gw-ims-org-id` required for cross-package action calls?** When the SPA calls delivery-fee actions (which are in the root application package, not the extension package), Adobe auth may require the org ID header in addition to the Bearer token.

3. **Should the Stores > Settings page registration go in the server-side registration action or in the client-side `register()` call?** The Admin UI SDK v3 has different extension points registered differently. Some (like `order.customFees`) go in the registration action payload. Others (like pages) may need client-side registration via `@adobe/uix-guest`. The plan assumes server-side but instructs the worker to verify via docs.
