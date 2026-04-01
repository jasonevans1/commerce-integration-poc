/**
 * Post-process hook for rules-list action.
 * Constructs the 200 response with the rules array.
 *
 * @param {object[]} rules - Array of rule objects
 * @returns {{ statusCode: number, body: { rules: object[] } }}
 */
function postProcess(rules) {
  return {
    statusCode: 200,
    body: { rules },
  };
}

module.exports = { postProcess };
