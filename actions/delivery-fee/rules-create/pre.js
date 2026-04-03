/**
 * Normalizes rule params before storing.
 * Uppercases country/region, trims name, parses value as float.
 *
 * @param {object} params - Request params
 * @returns {object} Normalized params
 */
function preProcess(params) {
  return {
    country: params.country.toUpperCase(),
    region: params.region.toUpperCase(),
    name: params.name.trim(),
    type: params.type,
    value: Number.parseFloat(params.value),
  };
}

module.exports = {
  preProcess,
};
