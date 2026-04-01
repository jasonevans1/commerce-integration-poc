/**
 * Formats the final response body for the calculate action.
 *
 * @param {number} fee - Calculated fee amount
 * @param {string} name - Fee rule name
 * @param {string} currency - Currency code
 * @returns {{ fee: number, name: string, currency: string }} Response body
 */
function postProcess(fee, name, currency) {
  return { fee, name, currency };
}

module.exports = {
  postProcess,
};
