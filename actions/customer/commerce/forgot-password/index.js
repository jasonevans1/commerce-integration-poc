const { telemetryConfig } = require("../../../telemetry");
const {
  instrumentEntrypoint,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

const { stringParameters } = require("../../../utils");
const { transformData } = require("./transformer");
const { sendData } = require("./sender");
const {
  HTTP_INTERNAL_ERROR,
  HTTP_BAD_REQUEST,
  HTTP_OK,
} = require("../../../constants");
const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { postProcess } = require("./post");

/**
 * Web action that receives the Commerce SaaS webhook:
 * observer.customer_forgot_email_set_template_vars_before
 *
 * Called synchronously by Commerce when a customer requests a password reset.
 * The JSON body is automatically parsed into params by the App Builder runtime.
 *
 * Expected payload shape:
 * {
 *   "eventName": "observer.customer_forgot_email_set_template_vars_before",
 *   "data": {
 *     "transportObject": {
 *       "customer": { "id": ..., "email": ..., "rp_token": ..., ... },
 *       "store": { ... }
 *     }
 *   }
 * }
 *
 * @param {object} params - env params + parsed webhook body
 * @returns HTTP response
 */
async function main(params) {
  const { logger } = getInstrumentationHelpers();

  logger.info("Forgot-password webhook received");
  logger.info(`FULL WEBHOOK PAYLOAD: ${JSON.stringify(params, null, 2)}`);
  logger.debug(`String params: ${stringParameters(params)}`);

  try {
    // Validate webhook secret and payload structure
    const validation = validateData(params);
    if (!validation.success) {
      logger.error(`Validation failed: ${validation.message}`);
      return {
        statusCode: HTTP_BAD_REQUEST,
        body: { op: "exception", message: validation.message },
      };
    }

    const transformedData = transformData(params);

    const preProcessed = preProcess(params, transformedData);

    const result = await sendData(params, transformedData, preProcessed);
    if (!result.success) {
      logger.error(`Send failed: ${result.message}`);
      return {
        statusCode: result.statusCode || HTTP_INTERNAL_ERROR,
        body: { op: "exception", message: result.message },
      };
    }

    postProcess(params, transformedData, preProcessed, result);

    logger.info("Forgot-password webhook processed successfully");
    return {
      statusCode: HTTP_OK,
      body: { op: "success" },
    };
  } catch (error) {
    logger.error(`Error processing webhook: ${error.message}`);
    return {
      statusCode: HTTP_INTERNAL_ERROR,
      body: { op: "exception", message: error.message },
    };
  }
}

exports.main = instrumentEntrypoint(main, {
  ...telemetryConfig,
  isSuccessful: (response) => response?.statusCode === HTTP_OK,
});
