/**
 * Normalizes params: uppercases country and region.
 *
 * @param {object} params - Request params
 * @returns {object} Normalized params
 */
function preProcess(params) {
  return {
    ...params,
    country: params.country.toUpperCase(),
    region: params.region.toUpperCase(),
  };
}

module.exports = { preProcess };
