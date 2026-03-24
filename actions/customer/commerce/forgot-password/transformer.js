const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Extracts customer data from the webhook payload and builds the EDS reset URL.
 *
 * Reset URL format:
 *   {EDS_STOREFRONT_URL}/customer/account/createPassword?id={customerId}&token={rpToken}
 *
 * @param {object} params - Full params (env vars + parsed webhook body)
 * @returns transformed data object including the reset URL
 */
function transformData(params) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("forgot-password.phase", { value: "transformData" });

  const customer = params.data.transportObject.customer;
  const store = params.data.transportObject.store || {};

  const resetUrl = `${params.EDS_STOREFRONT_URL}/customer/createpassword?id=${customer.id}&token=${customer.rp_token}&email=${encodeURIComponent(customer.email)}`;

  const transformed = {
    customerId: customer.id,
    email: customer.email,
    firstname: customer.firstname || null,
    lastname: customer.lastname || null,
    rpToken: customer.rp_token,
    resetUrl,
    storeId: store.id || null,
    storeName: store.name || null,
  };

  logger.info(
    `Transformed forgot-password event for customer ${transformed.customerId} — reset URL built`,
  );

  return transformed;
}

module.exports = {
  transformData: instrument(transformData),
};
