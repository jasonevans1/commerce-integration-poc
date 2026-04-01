const HTTP_OK = 200;
const HTTP_INTERNAL_ERROR = 500;

jest.mock("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("rules-list action", () => {
  let main;

  beforeEach(() => {
    jest.resetModules();
    jest.mock("../../../../actions/delivery-fee/lib/state-service");
    main = require("../../../../actions/delivery-fee/rules-list/index").main;
  });

  it("it returns 200 with empty rules array when no rules exist", async () => {
    const mockListRules =
      require("../../../../actions/delivery-fee/lib/state-service").listRules;
    mockListRules.mockResolvedValue([]);
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.rules).toEqual([]);
  });

  it("it returns 200 with all rules as an array", async () => {
    const mockListRules =
      require("../../../../actions/delivery-fee/lib/state-service").listRules;
    const rules = [
      {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      },
      {
        country: "US",
        region: "NY",
        name: "NY Rule",
        type: "percentage",
        value: 5,
      },
    ];
    mockListRules.mockResolvedValue(rules);
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.rules).toHaveLength(2);
  });

  it("it returns each rule with country, region, name, type, and value fields", async () => {
    const mockListRules =
      require("../../../../actions/delivery-fee/lib/state-service").listRules;
    const rules = [
      {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      },
    ];
    mockListRules.mockResolvedValue(rules);
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body.rules[0]).toEqual({
      country: "US",
      region: "CA",
      name: "CA Rule",
      type: "fixed",
      value: 10,
    });
  });

  it("it returns 500 with error message when state service throws", async () => {
    const mockListRules =
      require("../../../../actions/delivery-fee/lib/state-service").listRules;
    mockListRules.mockRejectedValue(new Error("State service failure"));
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_INTERNAL_ERROR);
    expect(result.body.error).toBe("Internal server error");
  });
});
