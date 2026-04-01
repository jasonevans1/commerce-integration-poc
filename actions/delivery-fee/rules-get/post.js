/**
 * Returns 200 with rule if found, 404 if null.
 *
 * @param {object|null} rule - Rule object or null
 * @param {string} originalCountry - Original country param (pre-normalization)
 * @param {string} originalRegion - Original region param (pre-normalization)
 * @returns {{ statusCode: number, body: object }}
 */
function postProcess(rule, originalCountry, originalRegion) {
  if (rule === null) {
    return {
      statusCode: 404,
      body: {
        error: `Rule not found for ${originalCountry}:${originalRegion}`,
      },
    };
  }

  return {
    statusCode: 200,
    body: { rule },
  };
}

module.exports = { postProcess };
