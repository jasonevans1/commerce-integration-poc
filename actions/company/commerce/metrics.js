const { defineMetrics } = require("@adobe/aio-lib-telemetry");
const { ValueType } = require("@adobe/aio-lib-telemetry/otel");

/** Metrics used across all actions. */
const commerceCompanyMetrics = defineMetrics((meter) => {
  return {
    consumerSuccessCounter: meter.createCounter(
      "company.commerce.consumer.success_count",
      {
        description:
          "A counter for the number of successful Commerce Company Consumer actions.",
        valueType: ValueType.INT,
      },
    ),

    consumerTotalCounter: meter.createCounter(
      "company.commerce.consumer.total_count",
      {
        description:
          "A counter for the number of total Commerce Company Consumer actions.",
        valueType: ValueType.INT,
      },
    ),
  };
});

module.exports = {
  commerceCompanyMetrics,
};
