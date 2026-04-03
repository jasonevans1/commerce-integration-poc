const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

/**
 * Calculate delivery fee for a given address and subtotal.
 *
 * @param {object} params - Request parameters: country, region, subtotal, currency
 * @returns {object} HTTP response with statusCode and body
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      return { statusCode: 400, body: { error: validation.message } };
    }

    const normalized = preProcess(params);
    const rule = await sendData(normalized);
    const { fee, name } = transformData(normalized, rule);
    const body = postProcess(fee, name, normalized.currency);

    return { statusCode: 200, body };
  } catch (_error) {
    return { statusCode: 500, body: { error: "Internal server error" } };
  }
}

exports.main = main;
