/**
 * Assembles the final Commerce webhook response for the OOP tax adjustment module.
 * For flat-rate POC, passes through the zero-adjustment shape: { taxes: [] }.
 *
 * @param {{ taxes: Array }} transformed - Transformed tax adjustment data
 * @returns {{ taxes: Array }} Commerce-compatible adjustment tax response
 */
function postProcess(transformed) {
  return transformed;
}

module.exports = {
  postProcess,
};
