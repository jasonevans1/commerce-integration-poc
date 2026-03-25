const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Hold any logic needed post sending information to external backoffice application
 *
 * @param {object} data - data received before transformation
 * @param {object} transformed - transformed received data
 * @param {object} preProcessed - preprocessed result data
 * @param {object} result - result data from the sender
 */
function postProcess(data, transformed, preProcessed, result) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "postProcess" });

  logger.info(
    `Company created event completed - ID: ${transformed.companyId}, type: ${transformed.eventType}, success: ${result.success}`,
  );
}

module.exports = {
  postProcess: instrument(postProcess),
};
