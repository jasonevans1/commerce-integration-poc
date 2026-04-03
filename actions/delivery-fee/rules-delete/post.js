/**
 * Returns 200 with success: true.
 *
 * @returns {{ statusCode: number, body: { success: boolean } }}
 */
function postProcess() {
  return { statusCode: 200, body: { success: true } };
}

module.exports = { postProcess };
