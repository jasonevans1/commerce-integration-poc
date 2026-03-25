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
    entity_id: TEST_COMPANY_ID,
    company_name: "Acme Corp",
    company_email: "admin@acme.com",
  };

  it("maps data.entity_id to companyId", () => {
    const result = transformer.transformData(validData);
    expect(result.companyId).toBe(TEST_COMPANY_ID);
  });

  it("maps data.company_name to companyName", () => {
    const result = transformer.transformData(validData);
    expect(result.companyName).toBe("Acme Corp");
  });

  it("uses company_admin firstname and lastname as customerName when present", () => {
    const result = transformer.transformData({
      ...validData,
      company_admin: { firstname: "Tim", lastname: "Scott" },
    });
    expect(result.customerName).toBe("Tim Scott");
  });

  it("falls back to company_email when company_admin name is absent", () => {
    const result = transformer.transformData(validData);
    expect(result.customerName).toBe("admin@acme.com");
  });

  it('defaults customerName to "Unknown Customer" when company_email and company_admin are absent', () => {
    const result = transformer.transformData({
      entity_id: TEST_COMPANY_ID,
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
