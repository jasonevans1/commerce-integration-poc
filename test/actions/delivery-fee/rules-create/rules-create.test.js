const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;

jest.mock("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("rules-create action", () => {
  let main;

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../../../../actions/delivery-fee/lib/state-service");
    main = require("../../../../actions/delivery-fee/rules-create/index").main;
  });

  it("it returns 400 when country is missing", async () => {
    const params = { region: "CA", name: "CA Rule", type: "fixed", value: 10 };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when region is missing", async () => {
    const params = { country: "US", name: "CA Rule", type: "fixed", value: 10 };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when name is missing", async () => {
    const params = { country: "US", region: "CA", type: "fixed", value: 10 };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when type is not fixed or percentage", async () => {
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "flat",
      value: 10,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when value is missing", async () => {
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when value is not a positive number", async () => {
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
      value: -5,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it returns 400 when type is percentage and value exceeds 100", async () => {
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "percentage",
      value: 150,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(result.body.error).toBeDefined();
  });

  it("it uppercases country and region before storing", async () => {
    const mockPutRule =
      require("../../../../actions/delivery-fee/lib/state-service").putRule;
    mockPutRule.mockResolvedValue(undefined);
    const params = {
      country: "us",
      region: "ca",
      name: "CA Rule",
      type: "fixed",
      value: 10,
    };
    await main(params);
    expect(mockPutRule).toHaveBeenCalledWith(
      expect.objectContaining({ country: "US", region: "CA" }),
    );
  });

  it("it stores rule in state and returns 200 with rule object", async () => {
    const mockPutRule =
      require("../../../../actions/delivery-fee/lib/state-service").putRule;
    mockPutRule.mockResolvedValue(undefined);
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
      value: 10,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.success).toBe(true);
    expect(result.body.rule).toEqual({
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
      value: 10,
    });
  });

  it("it overwrites existing rule when same country and region provided", async () => {
    const mockPutRule =
      require("../../../../actions/delivery-fee/lib/state-service").putRule;
    mockPutRule.mockResolvedValue(undefined);
    const params = {
      country: "US",
      region: "CA",
      name: "Updated Rule",
      type: "percentage",
      value: 5,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.rule.name).toBe("Updated Rule");
    expect(mockPutRule).toHaveBeenCalledTimes(1);
  });

  it("it returns 500 with error message when state service throws", async () => {
    const mockPutRule =
      require("../../../../actions/delivery-fee/lib/state-service").putRule;
    mockPutRule.mockRejectedValue(new Error("State service failure"));
    const params = {
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
      value: 10,
    };
    const result = await main(params);
    expect(result.statusCode).toBe(HTTP_INTERNAL_ERROR);
    expect(result.body.error).toBe("Internal server error");
  });
});
