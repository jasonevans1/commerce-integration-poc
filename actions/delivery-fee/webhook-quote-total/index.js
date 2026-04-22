const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;

/**
 * Commerce synchronous webhook handler for cart_total_repository.get.
 * Injects a custom delivery fee total segment via JSON Patch operations.
 *
 * @param {object} params - Commerce webhook payload
 * @returns {object} HTTP response with statusCode and body
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      return {
        statusCode: HTTP_BAD_REQUEST,
        body: { error: validation.message },
      };
    }

    const normalized = preProcess(params);
    const rule = await sendData(normalized);
    const { fee, name } = transformData(normalized, rule);
    const body = postProcess(fee, name, normalized, params);

    return { statusCode: HTTP_OK, body };
  } catch (_error) {
    return {
      statusCode: HTTP_INTERNAL_ERROR,
      body: { error: "Internal server error" },
    };
  }
}

exports.main = main;
