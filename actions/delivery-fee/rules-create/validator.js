const MAX_PERCENTAGE = 100;

/**
 * Validates delivery fee rule creation params.
 *
 * @param {object} params - Request params
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(params) {
  if (!params.country) {
    return { success: false, message: "country is required" };
  }

  if (!params.region) {
    return { success: false, message: "region is required" };
  }

  if (!params.name) {
    return { success: false, message: "name is required" };
  }

  if (params.type !== "fixed" && params.type !== "percentage") {
    return { success: false, message: "type must be fixed or percentage" };
  }

  if (params.value === undefined || params.value === null) {
    return { success: false, message: "value is required" };
  }

  const numValue = Number(params.value);

  if (Number.isNaN(numValue) || numValue <= 0) {
    return { success: false, message: "value must be a positive number" };
  }

  if (params.type === "percentage" && numValue > MAX_PERCENTAGE) {
    return { success: false, message: "percentage value must not exceed 100" };
  }

  return { success: true };
}

module.exports = {
  validateData,
};
