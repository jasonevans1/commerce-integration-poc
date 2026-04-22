const stateService = require("../lib/state-service");

/**
 * Fetches the delivery fee rule from state for the given normalized webhook context.
 *
 * @param {{ country: string, region: string }} normalized - Normalized webhook parameters
 * @returns {Promise<object|null>} Matched rule or null
 */
async function sendData(normalized) {
  return await stateService.getRule(normalized.country, normalized.region);
}

module.exports = {
  sendData,
};
