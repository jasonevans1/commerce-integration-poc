const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Pre-processing for forgot-password event.
 *
 * @param {object} data - Data received before transformation
 * @param {object} transformed - Transformed received data
 */
function preProcess(data, transformed) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("forgot-password.phase", { value: "preProcess" });

  logger.debug(
    `Pre-processing forgot-password event for customer ${transformed.customerId}`,
  );
}

module.exports = {
  preProcess: instrument(preProcess),
};
