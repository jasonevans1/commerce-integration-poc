const stateLib = require("@adobe/aio-lib-state");

const STATE_TTL = 31_536_000;

/**
 * Builds the state key for a delivery fee rule.
 * Format: rule.{COUNTRY}.{REGION} using only [a-zA-Z0-9-_.] characters.
 *
 * @param {string} country - Country code
 * @param {string} region - Region/state code
 * @returns {string} State key
 */
function buildKey(country, region) {
  return `rule.${country.toUpperCase()}.${region.toUpperCase()}`;
}

/**
 * Gets a delivery fee rule from state.
 *
 * @param {string} country - Country code
 * @param {string} region - Region/state code
 * @returns {Promise<object|null>} Rule object or null if not found
 */
async function getRule(country, region) {
  const state = await stateLib.init();
  const key = buildKey(country, region);
  const result = await state.get(key);

  if (result === undefined) {
    return null;
  }

  return JSON.parse(result.value);
}

/**
 * Stores a delivery fee rule in state.
 *
 * @param {object} rule - Rule object with country, region, name, type, value
 * @returns {Promise<void>}
 */
async function putRule(rule) {
  const state = await stateLib.init();
  const key = buildKey(rule.country, rule.region);
  await state.put(key, JSON.stringify(rule), { ttl: STATE_TTL });
}

/**
 * Deletes a delivery fee rule from state.
 *
 * @param {string} country - Country code
 * @param {string} region - Region/state code
 * @returns {Promise<void>}
 */
async function deleteRule(country, region) {
  const state = await stateLib.init();
  const key = buildKey(country, region);
  await state.delete(key);
}

/**
 * Lists all delivery fee rules from state.
 *
 * @returns {Promise<object[]>} Array of rule objects
 */
async function listRules() {
  const state = await stateLib.init();
  const rules = [];

  for await (const batch of state.list({ match: "rule.*" })) {
    for (const key of batch.keys) {
      const result = await state.get(key);
      if (result !== undefined) {
        rules.push(JSON.parse(result.value));
      }
    }
  }

  return rules;
}

module.exports = {
  getRule,
  putRule,
  deleteRule,
  listRules,
};
