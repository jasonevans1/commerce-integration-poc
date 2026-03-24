const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");
const { isOperationSuccessful } = require("../../../telemetry");

/**
 * Validates the forgot-password webhook request.
 *
 * Confirmed payload path (from Phase 1):
 *   params.data.transportObject.customer.{ id, email, rp_token, ... }
 *
 * @param {object} params - Full params (env vars + parsed webhook body)
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(params) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("forgot-password.phase", { value: "validateData" });

  const transportObject = params.data?.transportObject;
  if (!transportObject) {
    return {
      success: false,
      message: "data.transportObject not found in webhook payload",
    };
  }

  const customer = transportObject.customer;
  if (!customer) {
    return {
      success: false,
      message: "data.transportObject.customer not found in webhook payload",
    };
  }

  if (!customer.id) {
    return { success: false, message: "customer.id is required" };
  }

  if (!customer.email) {
    return { success: false, message: "customer.email is required" };
  }

  if (!customer.rp_token) {
    logger.error(
      "customer.rp_token is missing from webhook payload — cannot send reset email",
    );
    return { success: false, message: "customer.rp_token is required" };
  }

  if (!params.EDS_STOREFRONT_URL) {
    return { success: false, message: "EDS_STOREFRONT_URL is not configured" };
  }

  logger.info(
    `Validated forgot-password request for customer ${customer.id} (${customer.email})`,
  );

  return { success: true };
}

module.exports = {
  validateData: instrument(validateData, {
    isSuccessful: isOperationSuccessful,
  }),
};
