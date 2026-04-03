const stateService = require("../lib/state-service");

/**
 * Deletes the rule from state by country and region.
 *
 * @param {object} params - Normalized params with country and region
 * @returns {Promise<void>}
 */
async function sendData(params) {
  await stateService.deleteRule(params.country, params.region);
}

module.exports = { sendData };
