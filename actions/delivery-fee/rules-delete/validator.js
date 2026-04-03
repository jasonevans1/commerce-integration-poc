/**
 * Validates that country and region params are present.
 *
 * @param {object} params - Request params
 * @returns {{ success: boolean, message?: string }}
 */
function validateData(params) {
  if (!params.country) {
    return { success: false, message: "Missing required param: country" };
  }
  if (!params.region) {
    return { success: false, message: "Missing required param: region" };
  }
  return { success: true };
}

module.exports = { validateData };
