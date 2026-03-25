jest.mock("@adobe/aio-lib-telemetry", () => ({
  defineMetrics: jest.fn((fn) => fn),
  ValueType: { INT: "INT" },
}));

jest.mock("@adobe/aio-lib-telemetry/otel", () => ({
  ValueType: { INT: "INT" },
}));

describe("Given company commerce metrics", () => {
  let commerceCompanyMetrics;
  let mockMeter;

  beforeEach(() => {
    jest.resetModules();

    jest.mock("@adobe/aio-lib-telemetry", () => ({
      defineMetrics: jest.fn((fn) => fn),
    }));

    jest.mock("@adobe/aio-lib-telemetry/otel", () => ({
      ValueType: { INT: "INT" },
    }));

    mockMeter = {
      createCounter: jest.fn((name, options) => ({ name, options })),
    };

    const metrics = require("../../../../actions/company/commerce/metrics");
    commerceCompanyMetrics = metrics.commerceCompanyMetrics(mockMeter);
  });

  it("exports commerceCompanyMetrics with consumerSuccessCounter", () => {
    expect(commerceCompanyMetrics).toHaveProperty("consumerSuccessCounter");
  });

  it("exports commerceCompanyMetrics with consumerTotalCounter", () => {
    expect(commerceCompanyMetrics).toHaveProperty("consumerTotalCounter");
  });

  it('defines consumerSuccessCounter with correct metric name "company.commerce.consumer.success_count"', () => {
    expect(commerceCompanyMetrics.consumerSuccessCounter.name).toBe(
      "company.commerce.consumer.success_count",
    );
  });

  it('defines consumerTotalCounter with correct metric name "company.commerce.consumer.total_count"', () => {
    expect(commerceCompanyMetrics.consumerTotalCounter.name).toBe(
      "company.commerce.consumer.total_count",
    );
  });
});
