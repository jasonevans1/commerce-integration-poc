const stateService = require("../lib/state-service");

/**
 * Fetches a delivery fee rule from state for the given country and region.
 *
 * @param {object} params - Normalized parameters with country and region
 * @returns {Promise<object|null>} Rule object or null if not found
 */
async function sendData(params) {
  return await stateService.getRule(params.country, params.region);
}

module.exports = {
  sendData,
};
