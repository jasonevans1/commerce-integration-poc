/**
 * Pre-processes the Commerce webhook payload before transformation.
 * Normalises country_id and region_code to uppercase.
 *
 * @param {object} params - Webhook payload parameters
 * @returns {{ country: string, region: string, subtotal: number, currency: string }} Normalized parameters
 */
function preProcess(params) {
  const { shipping_address, subtotal, base_currency_code } = params.quote;
  const country = shipping_address.country_id.toUpperCase();
  const region = shipping_address.region_code
    ? shipping_address.region_code.toUpperCase()
    : "";

  return {
    country,
    region,
    subtotal,
    currency: base_currency_code,
  };
}

module.exports = {
  preProcess,
};
