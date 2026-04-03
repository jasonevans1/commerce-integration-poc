/**
 * Validates input params for rules-list action.
 * No input validation needed (no params); pass-through.
 *
 * @param {object} params - Action params
 * @returns {{ success: boolean }}
 */
function validateData(_params) {
  return { success: true };
}

module.exports = { validateData };
