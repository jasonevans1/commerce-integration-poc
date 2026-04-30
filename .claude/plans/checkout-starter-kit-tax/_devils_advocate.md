# Devil's Advocate Review: checkout-starter-kit-tax

## Critical (Must fix before building)

### C1. `actions/tax/actions.config.yaml` is a shared file edited by tasks 002 AND 003 — race condition risk and undefined order

Tasks 002 and 003 both write/modify `actions/tax/actions.config.yaml`:

- Task 002 creates the file with the `collect-taxes` entry.
- Task 003 adds the `collect-adjustment-taxes` entry to the same file.
- Task 004 then injects `inputs: { TAX_RATE_PERCENT: $TAX_RATE_PERCENT }` into both entries.

The `_plan.md` task table says task 003 depends on 002 (sequential), but the body of task 003 still has `Depends on: [002]` and the file says "Add ... to the existing `actions/tax/actions.config.yaml` created in task 002" — that is correct. However the dependency is implicit and easily missed if the file is regenerated. More importantly, the test in task 005 asserts on the entry created by 002, and the test in task 006 asserts on the entry created by 003 — both tests read the same file. If a worker re-runs task 002 in isolation it will overwrite task 003's entry.

**Fix applied**: Make task 002 explicitly state that the file is created with ONLY `collect-taxes`, and task 003 explicitly states the file must already contain `collect-taxes` (do not regenerate, append). Add a hard requirement that task 003 preserves the `collect-taxes` entry verbatim. Add an acceptance criterion to task 003 verifying both entries coexist.

### C2. `final: true` for tax synchronous webhooks contradicts the working reference

`_plan.md` Success Criteria says: "Both actions registered in `app.config.yaml` with `require-adobe-auth: false` and `final: true`."

But the working reference `actions/delivery-fee/actions.config.yaml` for `webhook-quote-total` uses `final: false`:

```yaml
webhook-quote-total:
  ...
  annotations:
    require-adobe-auth: false
    final: false
```

The Adobe Commerce SaaS synchronous webhook docs and starter-kit reference all use `final: false` for collect-taxes-style actions. Setting `final: true` on a synchronous webhook prevents the OOP tax module from invoking it via the public web action (and breaks the action registry in some cases — see MEMORY entry on Admin UI SDK 500 errors with `final: true` + `require-adobe-auth: true`).

Even though `require-adobe-auth: false` is OK with `final: true`, the starter kit's `collect-taxes` reference uses `final: false`. Workers will follow the success criteria over the reference and produce a non-functional integration.

**Fix applied**: Change success criteria and tasks 002, 003, 005, 006 to use `final: false` to match the reference and the starter kit source.

### C3. Task 001 uses wrong auth approach for SaaS Commerce REST

Task 001 says "Uses IMS OAuth (same pattern as other scripts in `scripts/onboarding/index.js`)." This is correct for SaaS, but the directly comparable existing pattern is `scripts/lib/commerce-eventing-api-client.js` which uses `getClient()` from `actions/oauth1a.js`. That client auto-detects IMS vs OAuth1a from `params` via `actions/auth.js` `fromParams()`.

The actual checkout-starter-kit `scripts/create-tax-integrations.js` upstream uses a different pattern (typically the @adobe/commerce-sdk client with OAuth1a OR IMS env detection). A worker fetching the upstream file verbatim will likely:

1. Hard-code OAuth1a (PaaS) when this project is SaaS
2. Or use `@adobe/commerce-sdk-auth` directly without going through this project's `fromParams`/`getClient` indirection

This will deploy but throw 401 on the POST to `/V1/oope_tax_management/tax_integration/:code`.

**Fix applied**: Update task 001 to explicitly call out the project's auth pattern (`getClient` from `actions/oauth1a.js` or `getAdobeAccessHeaders` from `actions/utils/adobe-auth.js`) and require the worker to adapt the upstream script to use this project's auth helpers rather than copy verbatim. Add a requirement to verify with a SaaS-style Bearer token in the test (mocked).

### C4. Task 005 / 006 cannot write tests without seeing action implementation — circular knowledge

Tasks 005 and 006 are flagged as depending on 002 and 003 respectively, but they're scheduled as separate tasks. The reference test file (`webhook-quote-total.test.js`) makes specific assertions about response body shape (e.g., `body[0].op === 'add'`, `body[0].path === '/totals/total_segments/-'`) which only make sense once the action implementation is known.

For tax, the response shape is an `oopQuote` structure (not JSON Patch like delivery-fee). Without the worker for task 005 having seen what the worker for task 002 implemented (and exact field names like `taxes`, `tax_amount`, `applied_taxes`, `appliedTax`, `cart_id`, etc.), the test will assert on the wrong shape.

**Fix applied**: Merge tasks 002+005 and 003+006 into single TDD tasks where the same worker writes the test and the implementation in one TDD cycle. This is consistent with the project's TDD standard. Update `_plan.md` task table.

### C5. `COMMERCE_WEBHOOKS_PUBLIC_KEY` signature verification is documented but never wired into the action

Task 002's Context section says "webhook signature verification uses `COMMERCE_WEBHOOKS_PUBLIC_KEY` if present" but no requirement, no test, and no implementation note actually mandates the worker wire signature verification into the handler.

For Commerce SaaS, synchronous webhooks send signed headers (`x-adobe-commerce-webhook-signature`). If the action does not verify the signature, ANY external caller can hit the endpoint (since `require-adobe-auth: false`) and inject fake tax responses. This is a production-safety hole.

**Fix applied**: Add a requirement to task 002 (and 003) to implement signature verification in `validator.js` using `COMMERCE_WEBHOOKS_PUBLIC_KEY`, with skip-if-not-set behavior for local dev. Add corresponding test to tasks 002/003 (now merged with 005/006). Add `COMMERCE_WEBHOOKS_PUBLIC_KEY` as an action input in task 004.

## Important (Should fix before building)

### I1. Task 002 doesn't define the `oopQuote` response interface — workers will guess

The Commerce OOP tax module has a strict response contract. Task 002 says "Research the exact payload shape from the starter kit source or docs" and "fetch the actual response format from the starter kit source rather than guessing" — this is hand-waving.

If the upstream repo is unreachable or the directory layout has changed, the worker is stuck. The plan should document the expected response shape directly (e.g., `{ taxes: [{ code, title, amount, type }], applied_taxes: [...] }` or whatever the SaaS OOP tax module expects) so workers can build to a known contract.

**Fix applied**: Add a "Response Contract" section to task 002 with the expected response shape, citing the starter kit source URL and the OOP tax module's endpoint contract. Add a fallback note that if the upstream cannot be fetched, the worker must invoke the `search-commerce-docs` MCP tool to find the official response schema.

### I2. Task 004 modifies `actions/tax/actions.config.yaml` AGAIN — three-way write conflict

`actions/tax/actions.config.yaml` is now written by 002, modified by 003, AND modified by 004 (to inject inputs). This is a three-way merge spread across three workers.

**Fix applied**: Move the `inputs: TAX_RATE_PERCENT: $TAX_RATE_PERCENT` injection into task 002 (for `collect-taxes`) and task 003 (for `collect-adjustment-taxes`). Task 004 only edits `app.config.yaml` and `env.dist`. Update task 004 to remove the actions.config.yaml requirement.

### I3. Task 001 omits webhook URL discovery / Commerce Admin webhook registration

Task 001 registers the tax integration record (`/V1/oope_tax_management/tax_integration/:code`) but the Commerce webhook (the actual HTTP endpoint that calls `collect_taxes`) must be registered separately. The plan's "Out of Scope" section says "Commerce webhook registration automation (manual via Admin UI)" — but this is not the same as the tax integration registration.

The user will need to:

1. Run `npm run create-tax-integrations` (registers the tax integration record)
2. Manually register the synchronous webhook in Commerce Admin pointing to the deployed `collect-taxes` action URL (similar to how `WEBHOOK_QUOTE_TOTAL_URL` is currently used in `.commerce-to-app-builder/webhooks.xml`)

These are two distinct steps and the plan only describes one.

**Fix applied**: Add explicit documentation requirement to task 004 explaining the two-step setup: (1) `npm run create-tax-integrations`, (2) manually configure synchronous webhook in Commerce Admin with the deployed action URL. Add `TAX_COLLECT_URL` and `TAX_COLLECT_ADJUSTMENT_URL` env vars to env.dist.

### I4. `tax-integrations.yaml` location is unspecified — root vs. config dir

Task 001 says `tax-integrations.yaml` lives at "project root" (per Acceptance Criteria) but the original starter kit may place it under `scripts/` or a config directory. The script needs to know where to load it from. If a worker creates it in `scripts/` instead of root, the npm script command may break.

**Fix applied**: Pin location to project root and add it to task 001 as an explicit path: `<repo-root>/tax-integrations.yaml`. Add a test assertion that the script reads from this path.

### I5. Test config requires 80% line coverage — small no-op handlers (`sender.js`, `pre.js`) may fail threshold

`test/jest.config.js` enforces `lines: 80`, `statements: 80`. The tax handler files include `sender.js` (no-op for flat rate) and `pre.js` (minimal normalization). If these are mostly empty, total coverage on the tax package may fall below threshold for new uncovered branches.

This isn't blocking immediately because coverage is global, but workers building tasks 005/006 (now merged) need to specifically test the `sendData` no-op and the `preProcess` paths to keep coverage in line.

**Fix applied**: Add explicit test requirements for `sendData` (returns expected no-op shape) and `preProcess` (extracts expected fields) to merged task 002 and merged task 003.

### I6. `final: false` on a public webhook means non-final actions can be chained; ensure no chaining happens

This is a follow-up to C2. With `final: false`, OpenWhisk allows another action to invoke this as a sub-action. For a Commerce webhook handler this is fine (the OOP tax module calls it directly), but worth a comment in the action so a future maintainer doesn't accidentally chain auth-bearing actions through it.

**Fix applied**: Note added in task 002/003 implementation context.

## Minor (Nice to address)

### M1. Tax rate type coercion

`TAX_RATE_PERCENT` env vars come in as strings. The transformer must `Number()` or `parseFloat` them — easy to forget, easy bug. Recommend explicit coercion test.

### M2. Floating-point tax math

Flat-rate × subtotal in JS will produce values like `8.499999999999999`. Real tax calculations use rounding (commonly half-up to 2 decimals). The reference delivery-fee handler uses raw multiplication with no rounding. The tax handler should round. Worth a test like `it rounds tax to 2 decimal places using bankers/half-up rounding`.

### M3. Multiple tax integrations active

The plan says "Commerce only allows one active tax integration at a time" but `tax-integrations.yaml` is structured as an array. If the upstream YAML supports multiple entries, the script must handle the case where the user has another integration already active and Commerce rejects the second `active: true`. Worth a 4xx error handling note in task 001.

## Questions for the Team

1. **Should `collect-adjustment-taxes` actually return zero adjustment for flat-rate?** The plan assumes yes, but for partial refunds the Commerce module expects proportional tax adjustments. A flat-rate POC may accept zero, but flagging in case the user expects symmetry with `collect-taxes`.

2. **Is signature verification optional or mandatory for this POC?** If POC-only, we can document the risk and skip; if going to staging/prod, it must be mandatory. The fix above assumes mandatory but skip-when-key-absent for local dev. Confirm with team.

3. **Should the merged 002+005 / 003+006 tasks become one larger task each, or stay split with task 005/006 as "test refinement / additional integration tests"?** I've merged them in the applied fixes; team may prefer split with explicit shared response-contract doc instead.

4. **Where does `tax-integrations.yaml` live?** Project root vs `scripts/onboarding/config/` vs new `scripts/tax/config/`. Applied fix: project root (matches starter kit convention). Confirm.
