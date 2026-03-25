jest.mock("@adobe/aio-lib-telemetry", () => ({
  instrument: jest.fn((fn) => fn),
  getInstrumentationHelpers: jest.fn(() => ({
    currentSpan: { addEvent: jest.fn() },
    logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
  })),
  instrumentEntrypoint: jest.fn((fn) => fn),
  defineTelemetryConfig: jest.fn((fn) => fn),
  getAioRuntimeResource: jest.fn(),
  getPresetInstrumentations: jest.fn(),
}));

const transformer = require("../../../../../actions/company/commerce/created/transformer");

const TEST_COMPANY_ID = 42;

describe("Given company commerce created transformer", () => {
  const validData = {
    id: TEST_COMPANY_ID,
    company_name: "Acme Corp",
    company_email: "admin@acme.com",
  };

  it("maps data.id to companyId", () => {
    const result = transformer.transformData(validData);
    expect(result.companyId).toBe(TEST_COMPANY_ID);
  });

  it("maps data.company_name to companyName", () => {
    const result = transformer.transformData(validData);
    expect(result.companyName).toBe("Acme Corp");
  });

  it("maps data.company_email to customerName", () => {
    const result = transformer.transformData(validData);
    expect(result.customerName).toBe("admin@acme.com");
  });

  it('defaults customerName to "Unknown Customer" when company_email is absent', () => {
    const result = transformer.transformData({
      id: TEST_COMPANY_ID,
      company_name: "Acme",
    });
    expect(result.customerName).toBe("Unknown Customer");
  });

  it('sets eventType to "created"', () => {
    const result = transformer.transformData(validData);
    expect(result.eventType).toBe("created");
  });

  it("does not include a timestamp field", () => {
    const result = transformer.transformData(validData);
    expect(result).not.toHaveProperty("timestamp");
  });
});
