const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

const { isOperationSuccessful } = require("../../../telemetry");

/**
 * Validate the company data received
 *
 * @param {object} data - Received data from Adobe Commerce
 * @returns the result of validation object
 */
function validateData(data) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "validateData" });

  if (!data || typeof data !== "object") {
    return { success: false, message: "Company data is required" };
  }

  if (!data.entity_id) {
    return { success: false, message: "Company entity_id is required" };
  }

  if (
    !data.company_name ||
    typeof data.company_name !== "string" ||
    !data.company_name.trim()
  ) {
    return { success: false, message: "Company name is required" };
  }

  return { success: true };
}

module.exports = {
  validateData: instrument(validateData, {
    isSuccessful: isOperationSuccessful,
  }),
};
