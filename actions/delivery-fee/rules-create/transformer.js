/**
 * Pass-through transformer — returns rule as-is.
 *
 * @param {object} rule - Rule object
 * @returns {object} Rule object unchanged
 */
function transformData(rule) {
  return rule;
}

module.exports = {
  transformData,
};
