const {
  instrumentEntrypoint,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

const { telemetryConfig } = require("../../../telemetry");
const { stringParameters } = require("../../../utils");
const { transformData } = require("./transformer");
const { sendData } = require("./sender");
const { HTTP_INTERNAL_ERROR, HTTP_BAD_REQUEST } = require("../../../constants");
const { validateData } = require("./validator");
const { preProcess } = require("./pre");
const { postProcess } = require("./post");
const {
  actionSuccessResponse,
  actionErrorResponse,
  isActionSuccessful,
} = require("../../../responses");

/**
 * This action is in charge of sending created company information from Adobe Commerce
 * to an external back-office application (admin notification email via Resend).
 *
 * @returns response object with status code and result
 * @param {object} params - includes the env params, type and the data of the event
 */
async function main(params) {
  const { logger } = getInstrumentationHelpers();

  logger.info("Start processing request");
  logger.debug(`Received params: ${stringParameters(params)}`);

  try {
    // Skip pre-save events that do not yet have a company ID assigned
    if (!params.data?.id) {
      logger.info("No company ID present — skipping pre-save event");
      return actionSuccessResponse("Company pre-save event skipped");
    }

    logger.debug(`Validate data: ${JSON.stringify(params.data)}`);
    const validation = validateData(params.data);
    if (!validation.success) {
      logger.error(`Validation failed with error: ${validation.message}`);
      return actionErrorResponse(HTTP_BAD_REQUEST, validation.message);
    }

    logger.debug(`Transform data: ${JSON.stringify(params.data)}`);
    const transformedData = transformData(params.data);

    logger.debug(`Preprocess data: ${stringParameters(params)}`);
    const preProcessed = preProcess(params, transformedData);

    logger.debug(`Start sending data: ${JSON.stringify(params)}`);
    const result = await sendData(params, transformedData, preProcessed);
    if (!result.success) {
      logger.error(`Send data failed: ${result.message}`);
      return actionErrorResponse(result.statusCode, result.message);
    }

    logger.debug(`Postprocess data: ${stringParameters(params)}`);
    postProcess(params, transformedData, preProcessed, result);

    logger.debug("Process finished successfully");
    return actionSuccessResponse("Company created successfully");
  } catch (error) {
    logger.error(`Error processing the request: ${error.message}`);
    return actionErrorResponse(HTTP_INTERNAL_ERROR, error.message);
  }
}

exports.main = instrumentEntrypoint(main, {
  ...telemetryConfig,
  isSuccessful: isActionSuccessful,
});
