const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;

jest.mock("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("rules-delete action", () => {
  let main;

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../../../../actions/delivery-fee/lib/state-service");
    main = require("../../../../actions/delivery-fee/rules-delete/index").main;
  });

  it("returns 400 when country query param is missing", async () => {
    const result = await main({ region: "CA" });
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("returns 400 when region query param is missing", async () => {
    const result = await main({ country: "US" });
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("uppercases country and region before deleting", async () => {
    const mockStateService = require("../../../../actions/delivery-fee/lib/state-service");
    mockStateService.deleteRule = jest.fn().mockResolvedValue(undefined);
    const result = await main({ country: "us", region: "ca" });
    expect(mockStateService.deleteRule).toHaveBeenCalledWith("US", "CA");
    expect(result.statusCode).toBe(HTTP_OK);
  });

  it("returns 200 with success true when rule exists", async () => {
    const mockStateService = require("../../../../actions/delivery-fee/lib/state-service");
    mockStateService.deleteRule = jest.fn().mockResolvedValue(undefined);
    const result = await main({ country: "US", region: "CA" });
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.success).toBe(true);
  });

  it("returns 200 with success true when rule does not exist (idempotent)", async () => {
    const mockStateService = require("../../../../actions/delivery-fee/lib/state-service");
    mockStateService.deleteRule = jest.fn().mockResolvedValue(undefined);
    const result = await main({ country: "US", region: "TX" });
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.success).toBe(true);
  });

  it("returns 500 with error message when state service throws", async () => {
    const mockStateService = require("../../../../actions/delivery-fee/lib/state-service");
    mockStateService.deleteRule = jest
      .fn()
      .mockRejectedValue(new Error("State error"));
    const result = await main({ country: "US", region: "CA" });
    expect(result.statusCode).toBe(HTTP_INTERNAL_ERROR);
    expect(result.body.error).toBe("Internal server error");
  });
});
