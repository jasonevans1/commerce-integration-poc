# Task 001: Tax Integration Config and Create Script

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Add the `tax-integrations.yaml` configuration file and the `scripts/create-tax-integrations.js` script adapted from the Adobe Commerce Checkout Starter Kit. Add `npm run create-tax-integrations` to `package.json`. This script is what the user runs after deployment to register the tax integration record in Commerce via REST API.

## Context

- **Source**: Fetch the actual implementation from the checkout starter kit repo:
  - `https://raw.githubusercontent.com/adobe/commerce-checkout-starter-kit/main/scripts/create-tax-integrations.js`
  - `https://raw.githubusercontent.com/adobe/commerce-checkout-starter-kit/main/tax-integrations.yaml`
  - Review these to understand the structure, then adapt for this project.
- **Auth (CRITICAL — SaaS project)**: This project is SaaS (`na1-sandbox.api.commerce.adobe.com`) using IMS OAuth 2.0 Server-to-Server. The starter-kit upstream `scripts/create-tax-integrations.js` likely targets PaaS / OAuth1a — DO NOT copy verbatim. Adapt to use this project's existing auth pattern:
  - `getClient(...)` from `actions/oauth1a.js` — auto-detects IMS vs OAuth1a via `actions/auth.js#fromParams`. Pass `process.env` as `params`.
  - OR use `getAdobeAccessHeaders(process.env)` from `actions/utils/adobe-auth.js` (used by `scripts/onboarding/index.js`) and call `got` / `fetch` directly with `Authorization: Bearer <imsToken>`.
  - Reference: `scripts/lib/commerce-eventing-api-client.js` shows the `getClient` indirection pattern in action.
- **Commerce endpoint**: `POST {COMMERCE_BASE_URL}/V1/oope_tax_management/tax_integration/:code` — `COMMERCE_BASE_URL` already ends with `/` per `env.dist`, so no double-slash. The `:code` path param should be the integration's `code` field (e.g., `flat-rate-tax`).
- **Existing pattern**: Look at `scripts/lib/commerce-eventing-api-client.js` and `scripts/onboarding/index.js` for how the project calls Commerce REST with IMS auth.
- **File location**: `tax-integrations.yaml` MUST live at the project root (`<repo-root>/tax-integrations.yaml`) — not under `scripts/`. The script reads from this exact path (`path.resolve(__dirname, '../tax-integrations.yaml')`).
- **Multiple integrations**: Although Commerce only allows one ACTIVE integration at a time, the YAML may contain multiple entries with `active: true|false`. The script should iterate the array and POST each. If Commerce returns 4xx because of conflict (existing active integration), the script should log a clear error message including the conflicting integration code.
- **Tax integration name**: `flat-rate-tax` (code), `Flat Rate Tax` (title), `active: true`, stores: `['default']`
- Related files to reference:
  - `scripts/onboarding/index.js` — IMS auth pattern
  - `package.json` — where to add the npm script
  - `env.dist` — read to understand what env vars are available (do NOT modify env.dist in this task — that's task 004)

## Requirements (Test Descriptions)

- [ ] `it creates tax-integrations.yaml at the project root with a single flat-rate-tax entry with active true and stores default`
- [ ] `it creates scripts/create-tax-integrations.js that exports a main function`
- [ ] `it adds create-tax-integrations script to package.json pointing to the create-tax-integrations.js script`
- [ ] `it reads COMMERCE_BASE_URL and OAUTH_* (IMS) credentials from process.env`
- [ ] `it uses the project's IMS auth pattern (getClient from actions/oauth1a.js or getAdobeAccessHeaders from actions/utils/adobe-auth.js) and sends an Authorization Bearer token`
- [ ] `it POSTs to /V1/oope_tax_management/tax_integration/:code for each tax integration entry`
- [ ] `it logs success message with integration codes on successful creation`
- [ ] `it throws or logs a formatted error message when the Commerce API returns 4xx or 5xx (including conflict on duplicate active integration)`

## Acceptance Criteria

- All requirements have passing tests
- `tax-integrations.yaml` created at project root (`<repo-root>/tax-integrations.yaml`)
- `scripts/create-tax-integrations.js` created
- `package.json` has `"create-tax-integrations"` script (e.g., `"create-tax-integrations": "node --no-warnings -e 'require(\"./scripts/create-tax-integrations.js\").main()'"`)
- Script uses IMS OAuth (Bearer token) — NOT OAuth1a — consistent with this SaaS project
- Script does NOT copy upstream starter-kit auth code verbatim if upstream uses OAuth1a — it uses `getClient` or `getAdobeAccessHeaders` from this project
- Code passes Biome lint

## Implementation Notes

(Left blank — filled in by programmer during implementation)
