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

const action = require("../../../../../actions/company/commerce/created");
jest.mock("../../../../../actions/company/commerce/created/validator");
jest.mock("../../../../../actions/company/commerce/created/sender");

const {
  validateData,
} = require("../../../../../actions/company/commerce/created/validator");
const {
  sendData,
} = require("../../../../../actions/company/commerce/created/sender");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given company commerce created action", () => {
  it("returns success response when all steps complete", async () => {
    validateData.mockReturnValue({ success: true });
    sendData.mockResolvedValue({ success: true });

    const params = {
      data: { id: 42, company_name: "Acme Corp" },
      ENABLE_TELEMETRY: true,
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        success: true,
        message: expect.any(String),
      },
    });
  });

  it("returns 400 error when validation fails", async () => {
    validateData.mockReturnValue({ success: false, message: "Invalid data" });

    const params = {
      data: { id: 42, company_name: "Acme Corp" },
      ENABLE_TELEMETRY: true,
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 400,
      body: {
        success: false,
        error: "Invalid data",
      },
    });
  });

  it("returns 500 error when sender fails", async () => {
    validateData.mockReturnValue({ success: true });
    sendData.mockResolvedValue({
      success: false,
      statusCode: 500,
      message: "Email failed",
    });

    const params = {
      data: { id: 42, company_name: "Acme Corp" },
      ENABLE_TELEMETRY: true,
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 500,
      body: {
        success: false,
        error: "Email failed",
      },
    });
  });
});
