/**
 * Assembles the final Commerce webhook response for the OOP tax module.
 *
 * @param {{ taxes: Array }} transformed - Transformed tax line items
 * @returns {{ taxes: Array }} Commerce-compatible tax response
 */
function postProcess(transformed) {
  return transformed;
}

module.exports = {
  postProcess,
};
