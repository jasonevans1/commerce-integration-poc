const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Post-processing for forgot-password event.
 *
 * @param {object} data - Data received before transformation
 * @param {object} transformed - Transformed received data
 * @param {object} preProcessed - Pre-processed result data
 * @param {object} result - Result data from the sender
 */
function postProcess(data, transformed, preProcessed, result) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("forgot-password.phase", { value: "postProcess" });

  logger.info(
    `Forgot-password event completed - Customer ID: ${transformed.customerId}, email: ${transformed.email}, rp_token present: ${!!transformed.rpToken}, success: ${result.success}`,
  );
}

module.exports = {
  postProcess: instrument(postProcess),
};
