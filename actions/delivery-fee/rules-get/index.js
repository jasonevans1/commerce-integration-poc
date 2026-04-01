const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

/**
 * Retrieves a single delivery fee rule by country and region from I/O State.
 *
 * @param {object} params - Request parameters including country and region query params
 * @returns {Promise<{ statusCode: number, body: object }>} HTTP response
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      return { statusCode: 400, body: { error: validation.message } };
    }

    const originalCountry = params.country;
    const originalRegion = params.region;

    const normalized = preProcess(params);
    const rule = await sendData(normalized);
    const transformed = transformData(rule);

    return postProcess(transformed, originalCountry, originalRegion);
  } catch (_error) {
    return { statusCode: 500, body: { error: "Internal server error" } };
  }
}

exports.main = main;
