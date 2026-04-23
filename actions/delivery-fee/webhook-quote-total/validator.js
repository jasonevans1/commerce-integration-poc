/**
 * Validates the Commerce webhook payload for the webhook-quote-total action.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ success: boolean, message?: string }} Validation result
 */
function validateData(params) {
  if (!params.quote) {
    return { success: false, message: "Missing required field: quote" };
  }

  if (!params.quote.shipping_address) {
    return {
      success: false,
      skip: true,
      message: "Missing required field: quote.shipping_address",
    };
  }

  if (!params.quote.shipping_address.country_id) {
    return {
      success: false,
      skip: true,
      message: "Missing required field: quote.shipping_address.country_id",
    };
  }

  return { success: true };
}

module.exports = {
  validateData,
};
