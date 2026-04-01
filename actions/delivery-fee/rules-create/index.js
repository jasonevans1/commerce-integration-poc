const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

/**
 * Creates or updates a delivery fee rule in I/O State.
 * Pipeline order: validator -> pre -> sender -> transformer -> post
 *
 * @param {object} params - Web action params (body fields are top-level)
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      return { statusCode: 400, body: { error: validation.message } };
    }

    const normalized = preProcess(params);
    const stored = await sendData(normalized);
    const transformed = transformData(stored);
    return postProcess(transformed);
  } catch (_error) {
    return { statusCode: 500, body: { error: "Internal server error" } };
  }
}

exports.main = main;
