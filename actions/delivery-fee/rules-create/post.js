/**
 * Formats the success response.
 *
 * @param {object} rule - Stored rule object
 * @returns {{ statusCode: number, body: { success: boolean, rule: object } }}
 */
function postProcess(rule) {
  return {
    statusCode: 200,
    body: {
      success: true,
      rule,
    },
  };
}

module.exports = {
  postProcess,
};
