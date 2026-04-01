/**
 * Normalizes input parameters: uppercases country and region, parses subtotal as float.
 *
 * @param {object} params - Request parameters
 * @returns {object} Normalized parameters
 */
function preProcess(params) {
  return {
    ...params,
    country: params.country.toUpperCase(),
    region: params.region.toUpperCase(),
    subtotal: Number.parseFloat(params.subtotal),
  };
}

module.exports = {
  preProcess,
};
