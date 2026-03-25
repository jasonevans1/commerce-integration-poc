const {
  instrumentEntrypoint,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");
const stateLib = require("@adobe/aio-lib-state");

const { commerceCompanyMetrics } = require("../metrics");
const { telemetryConfig } = require("../../../telemetry");
const {
  stringParameters,
  checkMissingRequestInputs,
} = require("../../../utils");
const {
  errorResponse,
  successResponse,
  isConsumerSuccessful,
} = require("../../../responses");
const {
  HTTP_BAD_REQUEST,
  HTTP_OK,
  HTTP_INTERNAL_ERROR,
} = require("../../../constants");
const Openwhisk = require("../../../openwhisk");

/**
 * This is the consumer of the events coming from Adobe Commerce related to company entity.
 *
 * @returns response object with status code, request data received and response of the invoked action
 * @param {object} params - includes the env params, type and the data of the event
 */
async function main(params) {
  const { logger, currentSpan, contextCarrier } = getInstrumentationHelpers();
  currentSpan.addEvent("event.type", { value: params.type });
  commerceCompanyMetrics.consumerTotalCounter.add(1);

  try {
    const eventId = params.event_id || params.eventid;
    if (eventId) {
      const state = await stateLib.init();
      const stateKey = `processed-event-${eventId}`;
      const alreadyProcessed = await state.get(stateKey);
      if (alreadyProcessed) {
        logger.info(`Duplicate event detected, skipping: ${eventId}`);
        return successResponse(params.type, { success: true });
      }
      await state.put(stateKey, "true", { ttl: 300 });
    }

    const openwhiskClient = new Openwhisk(params.API_HOST, params.API_AUTH);

    let response = {};
    let statusCode = HTTP_OK;

    logger.info("Start processing request");
    logger.debug(`Consumer main params: ${stringParameters(params)}`);

    const errorMessage = checkMissingRequestInputs(params, ["type"], []);
    if (errorMessage) {
      logger.error(`Invalid request parameters: ${errorMessage}`);
      return errorResponse(
        HTTP_BAD_REQUEST,
        `Invalid request parameters: ${errorMessage}`,
      );
    }

    logger.info(`Params type: ${params.type}`);

    switch (params.type) {
      case `com.adobe.commerce.${params.EVENT_PREFIX}.observer.company_save_commit_after`: {
        const data = params.data.value;

        if (data._isNew === true) {
          logger.info("Invoking created company");
          const res = await openwhiskClient.invokeAction(
            "company-commerce/created",
            {
              ...data,
              __telemetryContext: contextCarrier,
            },
          );

          response = res?.response?.result?.body;
          statusCode = res?.response?.result?.statusCode;
        } else {
          logger.info("Company update event, skipping notification");
          return successResponse(params.type, { success: true });
        }

        break;
      }

      default:
        logger.error(`Event type not found: ${params.type}`);
        return errorResponse(
          HTTP_BAD_REQUEST,
          `This case type is not supported: ${params.type}`,
        );
    }

    if (!response.success) {
      logger.error(`Error response: ${response.error}`);
      return errorResponse(statusCode, response.error);
    }

    logger.info(`Successful request: ${statusCode}`);
    commerceCompanyMetrics.consumerSuccessCounter.add(1);

    return successResponse(params.type, response);
  } catch (error) {
    logger.error(`Server error: ${error.message}`);
    return errorResponse(HTTP_INTERNAL_ERROR, `Server error: ${error.message}`);
  }
}

exports.main = instrumentEntrypoint(main, {
  ...telemetryConfig,
  isSuccessful: isConsumerSuccessful,
});
