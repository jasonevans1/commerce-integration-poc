# Tax Package

Out-of-process (OOP) tax integration for Adobe Commerce using synchronous webhooks. Provides a configurable flat-rate tax calculation that replaces Commerce's built-in tax engine at quote time.

## Overview

The `tax` package intercepts Commerce tax collection at checkout via two synchronous webhooks. Commerce calls these actions during quote calculation and applies the returned tax values directly to the cart — bypassing internal tax rules entirely.

Both actions are registered as raw-http webhooks, meaning Commerce delivers the request body as a base64-encoded string and expects a JSON-serialized response body (not a JSON object).

### Actions

| Action                     | Webhook Event                                                                                                     | Purpose                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `collect-taxes`            | `plugin.magento.out_of_process_tax_management.api.data.oop_quote_item_tax_collector_interface.collect`            | Calculates and applies flat-rate tax to all line items                      |
| `collect-adjustment-taxes` | `plugin.magento.out_of_process_tax_management.api.data.oop_quote_item_adjustment_tax_collector_interface.collect` | Handles credit memo tax adjustments — returns no operations (flat-rate POC) |

## Architecture

```
Commerce checkout (addProductsToCart / placeOrder)
      │
      │  POST (synchronous webhook, raw-http)
      │  base64-encoded body + x-adobe-commerce-webhook-signature
      ▼
collect-taxes
      │  decode base64 → verify RSA-SHA256 signature (optional)
      │  compute: unit_price × quantity × rate / 100 per item
      │  build JSON Patch ops (add tax_breakdown, replace tax per item)
      │
      │  JSON-serialized Patch array
      ▼
Commerce applies tax to quote items

Commerce credit memo
      │
      │  POST (synchronous webhook, raw-http)
      ▼
collect-adjustment-taxes
      │  returns [] — no adjustment ops for flat-rate
      ▼
Commerce handles credit memo tax internally
```

No external service calls are made. Both actions are fully self-contained — the flat-rate calculation uses only `TAX_RATE_PERCENT` from the action config and the item data from the webhook payload.

## Configuration

### Environment Variables

| Variable                       | Required | Description                                                                                                                                                        | Example                           |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `TAX_RATE_PERCENT`             | Yes      | Flat-rate tax percentage to apply                                                                                                                                  | `8.5`                             |
| `COMMERCE_WEBHOOKS_PUBLIC_KEY` | No       | RSA public key (PEM) for webhook signature verification. When set, all requests without a valid `x-adobe-commerce-webhook-signature` header are rejected with 401. | `-----BEGIN PUBLIC KEY-----\n...` |
| `LOG_LEVEL`                    | No       | Logging verbosity                                                                                                                                                  | `debug`                           |

### Action Config (`actions/tax/actions.config.yaml`)

Both actions share the same annotation pattern:

```yaml
collect-taxes:
  web: "yes"
  annotations:
    require-adobe-auth: false # Public — Commerce calls without IMS token
    final: false # Required for synchronous webhooks
    raw-http: true # Body arrives base64-encoded in __ow_body
```

`require-adobe-auth: false` and `final: false` are both required for Commerce synchronous webhooks. Setting `final: true` causes the app-registry validator to return a 500 error.

## Request Format

Commerce delivers the webhook payload as a JSON body, base64-encoded in the `__ow_body` parameter:

```json
{
  "oopQuote": {
    "items": [
      {
        "code": "item_001",
        "name": "Product Name",
        "unit_price": 100.0,
        "quantity": 2,
        "tax_class": "Taxable Goods"
      }
    ]
  }
}
```

The raw base64 body is also used for signature verification (see [Signature Verification](#signature-verification)).

## Response Format

Both actions return a JSON-serialized array of [JSON Patch](https://jsonpatch.com/) operations. Commerce applies these operations to the quote object.

**Critical:** The response body must be a JSON-serialized string, not a JSON object. Returning `{ taxes: [...] }` causes a silent "Internal server error" during `addProductsToCart`.

### `collect-taxes` Response

For each line item, two patch operations are emitted:

```json
[
  {
    "op": "add",
    "path": "oopQuote/items/0/tax_breakdown",
    "value": {
      "data": {
        "code": "flat-rate-tax",
        "rate": 8.5,
        "amount": 17.0,
        "title": "Flat Rate Tax",
        "tax_rate_key": "flat-rate-tax-8.5"
      }
    },
    "instance": "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface"
  },
  {
    "op": "replace",
    "path": "oopQuote/items/0/tax",
    "value": {
      "data": {
        "rate": 8.5,
        "amount": 17.0,
        "discount_compensation_amount": 0
      }
    },
    "instance": "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxInterface"
  }
]
```

### `collect-adjustment-taxes` Response

Returns an empty operations array. Commerce handles credit memo tax adjustment internally for the flat-rate use case.

```json
[]
```

## Tax Calculation

Tax is computed per line item using the formula:

```
taxAmount = round((unit_price × quantity × rate / 100) × 100) / 100
```

Amounts are rounded to 2 decimal places using `Math.round`. The rate is coerced from string to number — `TAX_RATE_PERCENT` arrives as a string from OpenWhisk param injection.

**Default behavior:** If `TAX_RATE_PERCENT` is not set, the rate defaults to `0` and all tax amounts are `0`.

## Signature Verification

When `COMMERCE_WEBHOOKS_PUBLIC_KEY` is set, the validator verifies the `x-adobe-commerce-webhook-signature` header using RSA-SHA256.

**Signing target:** The base64-encoded body string (`__ow_body`), not the decoded JSON. Tests must sign the base64 string, not the raw JSON payload.

```
verify(publicKey, base64Body) == signature_header_value (base64)
```

If the header is missing or the signature does not match, the action returns HTTP 401.

When `COMMERCE_WEBHOOKS_PUBLIC_KEY` is absent, signature verification is skipped entirely.

## Handler Pipeline

Both actions follow the standard 6-file handler structure:

```
actions/tax/collect-taxes/
├── index.js        — Orchestrates the pipeline; returns HTTP response
├── validator.js    — Decodes base64 body, validates oopQuote.items, verifies signature
├── pre.js          — Extracts items and taxRatePercent from decoded payload
├── transformer.js  — Computes tax amounts and builds JSON Patch operations array
├── sender.js       — No-op (flat-rate requires no external service call)
└── post.js         — JSON.stringify(operations) for Commerce response body
```

### Error Handling

| Condition                                  | Status Code | Response                                                |
| ------------------------------------------ | ----------- | ------------------------------------------------------- |
| Missing or malformed `oopQuote`            | 400         | `{ "error": "Missing required field: oopQuote" }`       |
| Missing `oopQuote.items`                   | 400         | `{ "error": "Missing required field: oopQuote.items" }` |
| Invalid base64 body encoding               | 400         | `{ "error": "Invalid request body encoding" }`          |
| Missing signature header (when key is set) | 401         | `{ "error": "Missing webhook signature or body" }`      |
| Invalid signature                          | 401         | `{ "error": "Invalid webhook signature" }`              |
| Unhandled exception                        | 500         | `{ "error": "Internal server error" }`                  |

## File Structure

```
actions/tax/
├── actions.config.yaml
├── collect-taxes/
│   ├── index.js
│   ├── validator.js
│   ├── pre.js
│   ├── transformer.js
│   ├── sender.js
│   └── post.js
└── collect-adjustment-taxes/
    ├── index.js
    ├── validator.js
    ├── pre.js
    ├── transformer.js   # Returns [] — no adjustment ops for flat-rate
    ├── sender.js
    └── post.js
```

## Testing

Tests are located at `test/actions/tax/`.

```bash
npm test -- --testPathPattern="tax"
```

The test suite covers:

- Action config assertions (web, auth annotations, required inputs)
- All 6 handler file exports present
- 400 on missing `oopQuote` or `oopQuote.items`
- Correct tax calculation for single and multiple items
- String-to-number coercion of `TAX_RATE_PERCENT`
- 2 decimal place rounding
- Zero tax when rate is `0` or unset
- 500 on unexpected internal errors
- Signature verification: skipped when key absent, 401 on bad signature, 200 on valid signature

### Test Signature Generation

Tests generate a live RSA key pair to sign the base64 body:

```js
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const base64Body = Buffer.from(JSON.stringify(payload)).toString("base64");
const sign = crypto.createSign("SHA256");
sign.update(base64Body); // Sign the base64 string, not the raw JSON
const signature = sign.sign(privateKey, "base64");
```

## Deployment

Ensure both variables are present in your `.env` / CI secrets before deploying:

```bash
TAX_RATE_PERCENT=8.5
COMMERCE_WEBHOOKS_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkq...
-----END PUBLIC KEY-----"
```

After deploying, register both webhooks in Commerce Admin under **System → Webhooks** and point them at the deployed action URLs.
