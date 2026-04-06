const HTTP_OK = 200;
const MOCK_FEE_VALUE = 5.0;
const EXPECTED_FEE_VALUE = 7.5;

jest.mock(
  "../../../actions/delivery-fee/lib/state-service",
  () => ({
    listRules: jest.fn(),
  }),
  { virtual: true },
);

describe("registration action", () => {
  let main;
  let stateService;

  beforeEach(() => {
    jest.resetModules();
    jest.mock(
      "../../../actions/delivery-fee/lib/state-service",
      () => ({
        listRules: jest.fn(),
      }),
      { virtual: true },
    );
    stateService = require("../../../actions/delivery-fee/lib/state-service");
    stateService.listRules.mockResolvedValue([]);
    main =
      require("../../../src/commerce-backend-ui-1/actions/registration/index").main;
  });

  it("it returns 200 with registration.order.customFees array", async () => {
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_OK);
    expect(Array.isArray(result.body.registration.order.customFees)).toBe(true);
  });

  it("it maps each rule to a customFee with id, label, and value", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "West Coast Fee",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
    ]);
    const result = await main({});
    const fee = result.body.registration.order.customFees[0];
    expect(fee).toHaveProperty("id");
    expect(fee).toHaveProperty("label");
    expect(fee).toHaveProperty("value");
  });

  it("it constructs the fee id as delivery-fee-{country}-{region} in lowercase", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "West Coast Fee",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
    ]);
    const result = await main({});
    expect(result.body.registration.order.customFees[0].id).toBe(
      "delivery-fee-us-ca",
    );
  });

  it("it constructs the fee label as Delivery Fee — {country}/{region}", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "West Coast Fee",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
    ]);
    const result = await main({});
    expect(result.body.registration.order.customFees[0].label).toBe(
      "Delivery Fee \u2014 US/CA",
    );
  });

  it("it sets fee value from rule.value", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "West Coast Fee",
        type: "fixed",
        value: EXPECTED_FEE_VALUE,
      },
    ]);
    const result = await main({});
    expect(result.body.registration.order.customFees[0].value).toBe(
      EXPECTED_FEE_VALUE,
    );
  });

  it("it returns empty customFees array when no rules exist in state", async () => {
    stateService.listRules.mockResolvedValue([]);
    const result = await main({});
    expect(result.body.registration.order.customFees).toEqual([]);
  });

  it("it returns empty customFees array when state service throws", async () => {
    stateService.listRules.mockRejectedValue(new Error("State unavailable"));
    const result = await main({});
    expect(result.body.registration.order.customFees).toEqual([]);
  });
});
