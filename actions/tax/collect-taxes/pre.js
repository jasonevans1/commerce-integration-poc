const DEFAULT_TAX_RATE = 0;

/**
 * Pre-processes the Commerce webhook payload before transformation.
 * Extracts taxable line items and the flat-rate tax percentage.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ items: Array, taxRatePercent: number }} Normalized parameters
 */
function preProcess(params) {
  const { items } = params.quote;
  const taxRatePercent =
    params.TAX_RATE_PERCENT !== undefined
      ? Number(params.TAX_RATE_PERCENT)
      : DEFAULT_TAX_RATE;

  return {
    items,
    taxRatePercent,
  };
}

module.exports = {
  preProcess,
};
