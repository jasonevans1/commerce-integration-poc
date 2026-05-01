/**
 * Pre-processes the Commerce webhook payload before transformation.
 * Decodes the raw body (raw-http: true) when present, otherwise reads params directly.
 * Extracts line items from the quote for adjustment tax processing.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ items: Array }} Normalized parameters
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

  return {
    items,
  };
}

module.exports = {
  preProcess,
};
