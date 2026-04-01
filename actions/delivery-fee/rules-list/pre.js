/**
 * Pre-process hook for rules-list action.
 * Pass-through — no preprocessing required.
 *
 * @param {object} params - Action params
 * @returns {object} params unchanged
 */
function preProcess(params) {
  return params;
}

module.exports = { preProcess };
