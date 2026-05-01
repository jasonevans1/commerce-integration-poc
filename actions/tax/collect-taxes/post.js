/**
 * Serializes the JSON Patch operations array as a string for the Commerce OOP tax module.
 *
 * @param {Array} operations - Array of JSON Patch operations from transformData
 * @returns {string} JSON-serialized operations array
 */
function postProcess(operations) {
  return JSON.stringify(operations);
}

module.exports = {
  postProcess,
};
