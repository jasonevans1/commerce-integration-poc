---
name: troubleshoot
description: Diagnoses and fixes errors for Adobe Commerce App Builder extensions. Use when encountering errors with aio app deploy, npm run onboard, npm run commerce-event-subscribe, or other runtime/configuration issues.
---

# Adobe Commerce App Builder Troubleshooter

## Role

You are an expert troubleshooter for Adobe Commerce App Builder extensions. Diagnose errors systematically, identify root causes, and provide step-by-step fixes with verification commands.

## General Protocol

1. Identify the phase where the error occurred (deploy / onboard / event-subscribe / runtime)
2. Request the full error message if not provided
3. Run quick diagnostics
4. Pattern-match to known issues below
5. Provide step-by-step fix + verification commands

---

## Deployment Troubleshooting (`aio app deploy`)

### Quick Diagnostics

```bash
# 1. Check authentication status
aio where

# 2. Verify workspace selection
aio console workspace list

# 3. Check Node.js version (requires >= 22)
node --version

# 4. Verify dependencies installed
npm install

# 5. Test build without deploying
npm run build
```

### Common Error: Module Not Found

```
Building actions for 'application'
Error: action build failed, webpack compilation errors:
Module not found: Error: Can't resolve '../../../../utils'
```

**Fix** — correct the relative path:

```javascript
// ❌ Wrong
const { checkMissingRequestInputs } = require("../../../../utils");

// ✅ Correct
const { checkMissingRequestInputs } = require("../../../utils");
```

### Common Error: YAML Parse Error

```
Error: The "paths[1]" argument must be of type string. Received undefined
```

**Cause** — commented-out `function:` line in app.config.yaml.

```yaml
# ❌ Bad
actions:
  my-action:
    # function: actions/my-action/index.js
    web: 'yes'

# ✅ Good
actions:
  my-action:
    function: actions/my-action/index.js
    web: 'yes'
```

### Common Error: Authentication Failure

```
Error: 401 Unauthorized
```

**Fix:**

```bash
aio login
aio where  # verify org/project/workspace
```

### Common Error: Action Timeout

**Fix** — increase timeout in app.config.yaml:

```yaml
limits:
  timeout: 300000 # 5 minutes (max 600000)
  memorySize: 512
```

---

## Onboarding Troubleshooting (`npm run onboard`)

### Quick Checks

```bash
npm run deploy                                          # App must be deployed first
ls scripts/onboarding/config/workspace.json            # Must exist
ls scripts/onboarding/config/starter-kit-registrations.json
grep -E "COMMERCE_BASE_URL|IO_CONSUMER_ID|OAUTH_CLIENT_ID" .env
```

### Error: INVALID_ENV_VARS

Missing or malformed environment variables.

**Fix** — verify `.env` has all required variables:

```bash
# Required core variables
IO_ORG_ID=
IO_CONSUMER_ID=
IO_PROJECT_ID=
IO_WORKSPACE_ID=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_SCOPES=
OAUTH_TECHNICAL_ACCOUNT_ID=
OAUTH_TECHNICAL_ACCOUNT_EMAIL=
ADOBE_IO_EVENTS_CLIENT_ID=
ADOBE_IO_EVENTS_CLIENT_SECRET=
COMMERCE_BASE_URL=
```

### Error: INVALID_IMS_AUTH_PARAMS

**Fix** — verify OAuth S2S credentials are correct and the service account has the right product profile access in Adobe Admin Console.

### Error: MISSING_WORKSPACE_FILE

`workspace.json` does not exist at `scripts/onboarding/config/workspace.json`.

**Fix:**

```bash
# Re-download workspace configuration
aio app use   # select correct org/project/workspace, then re-run onboard
```

### Error: PROVIDER_CREATION_FAILED (403)

**Cause** — app not deployed, or IMS org doesn't have I/O Events entitlement.

**Fix:**

```bash
aio app deploy          # ensure app is deployed first
npm run onboard         # retry
```

### Error: CREATE_EVENT_REGISTRATION_FAILED

**Cause** — app must be deployed before event registrations can be created.

**Fix:**

```bash
aio app deploy
npm run onboard
```

### Error: Invalid Merchant ID Format (CRITICAL)

Merchant ID must be **alphanumeric and underscores only** — no hyphens.

```bash
# ❌ Invalid
COMMERCE_ADOBE_IO_EVENTS_MERCHANT_ID=my-store-123

# ✅ Valid
COMMERCE_ADOBE_IO_EVENTS_MERCHANT_ID=my_store_123
```

### Error: Module Not Installed (404)

The Adobe I/O Events module is not installed in Commerce.

**Fix (PaaS only):**

```bash
composer require adobe/commerce-eventing
bin/magento module:enable Adobe_AdobeIoEventsClient Adobe_IO
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:flush
```

### Verifying Event Provider Registration

After onboarding, verify the provider registered correctly:

```bash
# Check via Commerce Admin:
# Stores > Configuration > Adobe Services > Adobe I/O Events > Commerce Events
# OR via REST:
# GET /rest/V1/adobe-io-events/get-all-event-providers
```

If `getEventProviders()` returns an empty array, the provider registration failed. Check your `.env` credentials and re-run `npm run onboard`.

---

## Event Subscription Troubleshooting (`npm run commerce-event-subscribe`)

### Quick Checks

```bash
npm run onboard         # Ensure onboarding completed first
ls scripts/commerce-event-subscribe/config/commerce-event-subscribe.json
grep -E "COMMERCE_PROVIDER_ID|EVENT_PREFIX|COMMERCE_BASE_URL" .env
```

### Error: EVENT_PREFIX Missing

```bash
# Add to .env
EVENT_PREFIX=your_unique_prefix
```

### Error: COMMERCE_PROVIDER_ID Missing

```bash
# After successful onboard, this is auto-populated in .env
# If missing, re-run: npm run onboard
```

### Error: INVALID_JSON_FILE

Malformed JSON in `commerce-event-subscribe.json`.

**Fix:**

```bash
jq . scripts/commerce-event-subscribe/config/commerce-event-subscribe.json
# Fix any syntax errors reported
```

### Error: MALFORMED_EVENT_SPEC (CRITICAL — Often Misleading)

**Actual cause** — this error is frequently triggered by a **duplicate subscription**, not a malformed spec. Commerce returns 400, but the script mislabels it.

**Check first:**

```bash
# Via Commerce Admin: Stores > Configuration > Adobe Services > Adobe I/O Events
# Look for existing subscriptions matching your event names
```

If the event is already subscribed, this error is harmless — the subscription exists and is active.

### Error: Wrong Event Name Format

Event names MUST include the type prefix.

```json
// ❌ Invalid — causes 400 error
{ "name": "catalog_product_save_commit_after" }

// ✅ Valid
{ "name": "observer.catalog_product_save_commit_after" }
```

---

## Runtime Action Troubleshooting

### Viewing Logs

```bash
aio app logs           # last activations
aio app logs --tail    # stream live
aio runtime activation list --limit 10
aio runtime activation get <activation-id>
aio runtime activation logs <activation-id>
```

### Common: Invalid Event Signature

**Cause** — wrong `ADOBE_IO_EVENTS_CLIENT_SECRET` in `.env` / action inputs.

**Fix** — verify the secret matches the I/O Events credential in Adobe Developer Console.

### Common: State / Files Access Denied (403)

**Cause** — workspace mismatch between where the app is deployed and where state is being accessed.

**Fix** — ensure `STATE_REGION` matches your deployment region (`amer`, `emea`, `apac`).

### Common: Action Invocation Timeout

**Fix** — increase `timeout` in app.config.yaml (max 600000ms = 10 minutes). For long-running tasks, consider scheduled actions with state checkpointing.

### Local Testing with MCP Tools

```bash
# Start local dev server
aio app dev

# Invoke action locally with mock payload
# Use: commerce-extensibility:aio-dev-invoke
# Or CLI:
aio runtime action invoke <action-name> -p data '{"event":{"@type":"..."}}'
```

---

## Diagnostic Commands Reference

```bash
# Auth & workspace
aio login
aio where
aio console workspace list

# Deployment
aio app deploy
aio app undeploy
aio app build

# Logs
aio app logs
aio runtime activation list
aio runtime activation get <id>
aio runtime activation logs <id>

# Config validation
jq . scripts/onboarding/config/events.json
jq . scripts/onboarding/config/providers.json
jq . scripts/commerce-event-subscribe/config/commerce-event-subscribe.json
node -e "require('js-yaml').load(require('fs').readFileSync('app.config.yaml','utf8'))" && echo "YAML OK"
```
