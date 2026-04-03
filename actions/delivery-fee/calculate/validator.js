/**
 * Validates the parameters for the calculate delivery fee action.
 *
 * @param {object} params - Request parameters
 * @returns {{ success: boolean, message?: string }} Validation result
 */
function validateData(params) {
  if (!params.country) {
    return { success: false, message: "Missing required parameter: country" };
  }

  if (!params.region) {
    return { success: false, message: "Missing required parameter: region" };
  }

  if (
    params.subtotal === undefined ||
    params.subtotal === null ||
    params.subtotal === ""
  ) {
    return { success: false, message: "Missing required parameter: subtotal" };
  }

  const subtotal = Number.parseFloat(params.subtotal);
  if (Number.isNaN(subtotal) || subtotal <= 0) {
    return { success: false, message: "subtotal must be a positive number" };
  }

  if (!params.currency) {
    return { success: false, message: "Missing required parameter: currency" };
  }

  return { success: true };
}

module.exports = {
  validateData,
};
