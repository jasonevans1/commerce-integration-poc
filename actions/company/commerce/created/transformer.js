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

  const adminName =
    data.company_admin?.firstname && data.company_admin?.lastname
      ? `${data.company_admin.firstname} ${data.company_admin.lastname}`
      : data.company_email || "Unknown Customer";

  return {
    companyId: data.entity_id,
    companyName: data.company_name,
    customerName: adminName,
    eventType: "created",
  };
}

module.exports = {
  transformData: instrument(transformData),
};
