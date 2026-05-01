const crypto = require("node:crypto");

const SIGNATURE_HEADER = "x-adobe-commerce-webhook-signature";
const HTTP_UNAUTHORIZED = 401;

/**
 * Validates the Commerce webhook payload for the collect-taxes action.
 * Supports both raw-http (body in __ow_body) and direct param injection modes.
 * Also verifies the webhook signature using COMMERCE_WEBHOOKS_PUBLIC_KEY when present.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ success: boolean, message?: string, statusCode?: number }} Validation result
 */
function validateData(params) {
  let oopQuote;

  if (params.__ow_body) {
    try {
      const decoded = Buffer.from(params.__ow_body, "base64").toString("utf8");
      const body = JSON.parse(decoded);
      oopQuote = body.oopQuote;
    } catch (_error) {
      return { success: false, message: "Invalid request body encoding" };
    }
  } else {
    oopQuote = params.oopQuote;
  }

  if (!oopQuote) {
    return { success: false, message: "Missing required field: oopQuote" };
  }

  if (!oopQuote.items) {
    return {
      success: false,
      message: "Missing required field: oopQuote.items",
    };
  }

  const publicKey = params.COMMERCE_WEBHOOKS_PUBLIC_KEY;
  if (publicKey) {
    const signature = params.__ow_headers?.[SIGNATURE_HEADER];
    const body = params.__ow_body;

    if (!(signature && body)) {
      return {
        success: false,
        statusCode: HTTP_UNAUTHORIZED,
        message: "Missing webhook signature or body",
      };
    }

    try {
      const verify = crypto.createVerify("SHA256");
      verify.update(body);
      verify.end();
      const isValid = verify.verify(publicKey, signature, "base64");
      if (!isValid) {
        return {
          success: false,
          statusCode: HTTP_UNAUTHORIZED,
          message: "Invalid webhook signature",
        };
      }
    } catch (_error) {
      return {
        success: false,
        statusCode: HTTP_UNAUTHORIZED,
        message: "Signature verification failed",
      };
    }
  }

  return { success: true };
}

module.exports = {
  validateData,
};
