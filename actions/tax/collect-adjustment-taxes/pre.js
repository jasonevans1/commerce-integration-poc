/**
 * Pre-processes the Commerce webhook payload before transformation.
 * Extracts line items from the quote for adjustment tax processing.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ items: Array }} Normalized parameters
 */
function preProcess(params) {
  const { items } = params.quote;

  return {
    items,
  };
}

module.exports = {
  preProcess,
};
