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

const validator = require("../../../../../actions/company/commerce/created/validator");

describe("Given company commerce created validator", () => {
  it("returns success true for valid company data with id and company_name", () => {
    const result = validator.validateData({
      entity_id: 1,
      company_name: "Acme Corp",
    });
    expect(result).toMatchObject({ success: true });
  });

  it("returns success false when data is missing", () => {
    const result = validator.validateData(null);
    expect(result).toMatchObject({ success: false });
  });

  it("returns success false when data.id is missing", () => {
    const result = validator.validateData({ company_name: "Acme Corp" });
    expect(result).toMatchObject({ success: false });
  });

  it("returns success false when data.company_name is missing", () => {
    const result = validator.validateData({ entity_id: 1 });
    expect(result).toMatchObject({ success: false });
  });

  it("returns success false when data.company_name is an empty string", () => {
    const result = validator.validateData({ entity_id: 1, company_name: "" });
    expect(result).toMatchObject({ success: false });
  });
});
