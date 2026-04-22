# Task 003: Commerce webhooks.xml Registration

**Status**: completed
**Depends on**: 001
**Retry count**: 0

## Description

Create the `webhooks.xml` file that registers the `webhook-quote-total` App Builder action as a synchronous Commerce webhook. This file is deployed to Commerce (SaaS) via the `aio commerce:webhooks` CLI or included in the app deployment. It subscribes to the `plugin.magento.quote.api.cart_total_repository.get` operation (after phase) so Commerce calls the App Builder action each time cart totals are recalculated.

## Context

- Related files:
  - `.commerce-to-app-builder/webhooks.xml` — create this file (standard location for Commerce webhook registration in App Builder projects)
  - `actions/delivery-fee/webhook-quote-total/index.js` — the action being registered
  - `app.config.yaml` — no changes needed; the action URL is resolved at deploy time

- Webhook registration requires:
  - `name`: the Commerce operation to hook (fully qualified)
  - `method`: `after` (we modify the response after Commerce computes totals)
  - `url`: the deployed App Builder action URL (use `{APP_BUILDER_RUNTIME_URL}` placeholder or environment variable `WEBHOOK_ACTION_URL`)
  - `timeout`: 5000ms (max allowed by Commerce for synchronous webhooks)
  - `softTimeout`: 2000ms (Commerce continues checkout if App Builder exceeds this)
  - `required`: false (checkout must not be blocked by webhook failures)
  - `fields`: limit to only the fields the handler needs (quote.shipping_address, totals)

- Webhook shared secret: Commerce Admin > System > Webhooks generates a shared secret that Commerce includes as an `X-Magento-Webhooks-Signature` header. The handler should log this header in pre.js for future signature verification (full verification is out of scope for this phase).

## Requirements (Test Descriptions)

- [ ] `it creates webhooks.xml with the correct operation name plugin.magento.quote.api.cart_total_repository.get`
- [ ] `it registers the hook with method after`
- [ ] `it sets required to false`
- [ ] `it sets timeout to 5000 and softTimeout to 2000`
- [ ] `it includes quote.shipping_address fields in the field mapping`
- [ ] `it includes totals.grand_total and totals.total_segments in the field mapping`
- [ ] `it references the action URL via environment variable placeholder`

## Acceptance Criteria

- All requirements have passing tests (schema validation of the XML)
- `webhooks.xml` is created at `.commerce-to-app-builder/webhooks.xml`
- XML is valid and passes any available linting
- README note added to the plan (not a file — note here): the webhook URL must be updated in Commerce Admin > System > Webhooks after each deployment with the new action URL from `aio app deploy` output

## Implementation Notes

Reference XML structure:

```xml
<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_AdobeCommerceWebhooks:etc/webhooks.xsd">
  <method name="plugin.magento.quote.api.cart_total_repository.get" type="after">
    <hooks>
      <batch name="delivery_fee_batch">
        <hook name="delivery_fee_total"
              url="{env:WEBHOOK_QUOTE_TOTAL_URL}"
              timeout="5000"
              softTimeout="2000"
              required="false"
              priority="100">
          <fields>
            <field name="quote.shipping_address.country_id" />
            <field name="quote.shipping_address.region_code" />
            <field name="quote.subtotal" />
            <field name="quote.base_currency_code" />
            <field name="totals.grand_total" />
            <field name="totals.total_segments" />
          </fields>
        </hook>
      </batch>
    </hooks>
  </method>
</config>
```

Add `WEBHOOK_QUOTE_TOTAL_URL=` to `.env.example` with a comment explaining it is the deployed action URL.

**Deployment note:** The `.commerce-to-app-builder/` directory does not yet exist in this project. This task creates it as a convention for storing Commerce webhook registration files. The `webhooks.xml` file is NOT auto-deployed by `aio app deploy`. After deployment, the webhook must be registered in Commerce via one of:

1. Commerce Admin > System > Webhooks (manual upload)
2. `aio commerce:webhooks:subscribe` CLI command (if available)
3. Commerce REST API for webhook management

Document the chosen deployment method in the file header as a comment or in a sibling README.
