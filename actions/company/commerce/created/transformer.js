const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Transform the received company data from Adobe Commerce
 *
 * @param {object} data - Data received from Adobe Commerce
 * @returns transformed data object
 */
function transformData(data) {
  const { currentSpan } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "transformData" });

  return {
    companyId: data.id,
    companyName: data.company_name,
    customerName: data.company_email || "Unknown Customer",
    eventType: "created",
  };
}

module.exports = {
  transformData: instrument(transformData),
};
