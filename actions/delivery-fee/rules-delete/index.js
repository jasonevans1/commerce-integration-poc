const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

/**
 * Deletes a delivery fee rule from I/O State by country and region.
 *
 * @param {object} params - Includes country and region query params
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      return { statusCode: 400, body: { error: validation.message } };
    }

    const normalized = preProcess(params);

    await sendData(normalized);

    transformData();

    return postProcess();
  } catch (_error) {
    return { statusCode: 500, body: { error: "Internal server error" } };
  }
}

exports.main = main;
