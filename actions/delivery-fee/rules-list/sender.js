const stateService = require("../lib/state-service");

/**
 * Retrieves all delivery fee rules from I/O State.
 *
 * @returns {Promise<object[]>} Array of rule objects
 */
async function sendData() {
  return await stateService.listRules();
}

module.exports = { sendData };
