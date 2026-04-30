const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { sendData } = require("./sender");
const { transformData } = require("./transformer");
const { postProcess } = require("./post");

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const HTTP_UNAUTHORIZED = 401;

/**
 * Commerce synchronous webhook handler for OOP tax collection.
 * Applies a configurable flat-rate tax percentage to taxable line items.
 *
 * @param {object} params - Commerce webhook payload
 * @returns {object} HTTP response with statusCode and body
 */
async function main(params) {
  try {
    const validation = validateData(params);
    if (!validation.success) {
      const statusCode =
        validation.statusCode === HTTP_UNAUTHORIZED
          ? HTTP_UNAUTHORIZED
          : HTTP_BAD_REQUEST;
      return {
        statusCode,
        body: { error: validation.message },
      };
    }

    const normalized = preProcess(params);
    await sendData(normalized);
    const transformed = transformData(normalized);
    const body = postProcess(transformed);

    return { statusCode: HTTP_OK, body };
  } catch (_error) {
    return {
      statusCode: HTTP_INTERNAL_ERROR,
      body: { error: "Internal server error" },
    };
  }
}

exports.main = main;
