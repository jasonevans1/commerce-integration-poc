const stateService = require("../lib/state-service");

/**
 * Retrieves a delivery fee rule from state.
 *
 * @param {object} params - Normalized request parameters
 * @returns {Promise<object|null>} Rule object or null
 */
async function sendData(params) {
  return await stateService.getRule(params.country, params.region);
}

module.exports = { sendData };
