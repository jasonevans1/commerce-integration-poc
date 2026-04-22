# Task 001: Webhook Action Config + Directory Scaffold

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create the configuration scaffold for the new `webhook-quote-total` action under the `delivery-fee` package. This includes adding the action entry to `actions/delivery-fee/actions.config.yaml` and creating the six empty handler files. The handler is a Commerce synchronous webhook that fires after `cart_total_repository.get` to inject a custom delivery fee total segment.

## Context

- Related files:
  - `actions/delivery-fee/actions.config.yaml` — add new action entry here
  - `app.config.yaml` — already includes `delivery-fee` package; no change needed
  - `actions/delivery-fee/calculate/` — reference for the 6-file pattern (public web action)
  - `actions/delivery-fee/rules-create/` — reference for the auth-protected pattern

- Patterns to follow:
  - Existing actions in `actions/delivery-fee/` use `web: 'yes'` for runtime invocation
  - Webhook actions are publicly reachable (Commerce calls them); `require-adobe-auth: false`
  - Inputs/outputs annotated in `actions.config.yaml` for documentation

- Webhook endpoint: Commerce calls this URL directly over HTTPS. It must be publicly accessible. No Adobe auth — Commerce authenticates via a shared secret in headers (configured separately in Commerce Admin > Webhooks).

## Requirements (Test Descriptions)

- [ ] `it adds webhook-quote-total entry to actions.config.yaml with web yes and require-adobe-auth false`
- [ ] `it creates all six handler files: index.js, validator.js, pre.js, transformer.js, sender.js, post.js`
- [ ] `it exports main from index.js following the standard handler pattern`
- [ ] `it exports validateData from validator.js`
- [ ] `it exports preProcess from pre.js`
- [ ] `it exports transformData from transformer.js`
- [ ] `it exports sendData from sender.js`
- [ ] `it exports postProcess from post.js`

## Acceptance Criteria

- All requirements have passing tests
- `actions/delivery-fee/actions.config.yaml` updated with webhook-quote-total entry
- Six files created under `actions/delivery-fee/webhook-quote-total/`
- Stub implementations pass lint (`npm run code:lint:fix && npm run code:format:fix`)

## Implementation Notes

`actions.config.yaml` entry for webhook-quote-total:

```yaml
webhook-quote-total:
  function: actions/delivery-fee/webhook-quote-total/index.js
  web: "yes"
  runtime: nodejs:22
  require-adobe-auth: false
  annotations:
    require-adobe-auth: false
    final: false
  inputs:
    LOG_LEVEL: debug
```

The action accepts the Commerce webhook payload (JSON body with quote and totals data) and returns JSON Patch operations to inject the custom fee total segment.
