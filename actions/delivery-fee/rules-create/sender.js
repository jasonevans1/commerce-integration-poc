const stateService = require("../lib/state-service");

/**
 * Stores the rule in I/O State.
 *
 * @param {object} rule - Normalized rule object
 * @returns {Promise<object>} The stored rule
 */
async function sendData(rule) {
  await stateService.putRule(rule);
  return rule;
}

module.exports = {
  sendData,
};
