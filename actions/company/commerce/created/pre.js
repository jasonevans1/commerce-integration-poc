const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Hold any logic needed pre sending information to external backoffice application
 *
 * @param {object} data - Data received before transformation
 * @param {object} transformed - Transformed received data
 */
function preProcess(data, transformed) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "preProcess" });

  logger.debug(
    `Pre-processing company created event for company ${transformed.companyId}`,
  );
}

module.exports = {
  preProcess: instrument(preProcess),
};
