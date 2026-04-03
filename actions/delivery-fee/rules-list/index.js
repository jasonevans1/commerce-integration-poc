const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

/**
 * Lists all delivery fee rules from I/O State.
 *
 * Orchestration order: validator -> pre -> sender -> transformer -> post
 *
 * @param {object} params - Action params
 * @returns {{ statusCode: number, body: object }}
 */
async function main(params) {
  try {
    validateData(params);
    preProcess(params);
    const rules = await sendData();
    const transformed = transformData(rules);
    return postProcess(transformed);
  } catch (_error) {
    return {
      statusCode: 500,
      body: { error: "Internal server error" },
    };
  }
}

exports.main = main;
