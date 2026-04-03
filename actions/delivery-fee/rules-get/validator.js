/**
 * Validates that country and region params are present.
 *
 * @param {object} params - Request parameters
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(params) {
  if (!params.country) {
    return { success: false, message: "Missing required parameter: country" };
  }

  if (!params.region) {
    return { success: false, message: "Missing required parameter: region" };
  }

  return { success: true };
}

module.exports = { validateData };
