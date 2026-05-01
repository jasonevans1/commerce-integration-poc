const DEFAULT_TAX_RATE = 0;

/**
 * Pre-processes the Commerce webhook payload before transformation.
 * Decodes the raw body (raw-http: true) when present, otherwise reads params directly.
 * Extracts taxable line items and the flat-rate tax percentage.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ items: Array, taxRatePercent: number }} Normalized parameters
 */
function preProcess(params) {
  let oopQuote;

  if (params.__ow_body) {
    const decoded = Buffer.from(params.__ow_body, "base64").toString("utf8");
    const body = JSON.parse(decoded);
    oopQuote = body.oopQuote;
  } else {
    oopQuote = params.oopQuote;
  }

  const { items } = oopQuote;
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
