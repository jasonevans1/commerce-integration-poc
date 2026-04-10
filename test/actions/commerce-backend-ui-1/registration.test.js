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

  it("returns 200 with registration.order.customFees array", async () => {
    const result = await main({});
    expect(result.statusCode).toBe(HTTP_OK);
    expect(Array.isArray(result.body.registration.order.customFees)).toBe(true);
  });

  it("maps each rule to a customFee with id, label, and value", async () => {
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

  it("constructs the fee id as delivery-fee-rules::us-ca format", async () => {
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
      "delivery-fee-rules::us-ca",
    );
  });

  it("constructs the fee label as Delivery Fee — {country}/{region}", async () => {
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

  it("sets fee value from rule.value", async () => {
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

  it("returns empty customFees array when no rules exist in state", async () => {
    stateService.listRules.mockResolvedValue([]);
    const result = await main({});
    expect(result.body.registration.order.customFees).toEqual([]);
  });

  it("returns empty customFees array when state service throws", async () => {
    stateService.listRules.mockRejectedValue(new Error("State unavailable"));
    const result = await main({});
    expect(result.body.registration.order.customFees).toEqual([]);
  });

  it("includes order.massActions in the registration response", async () => {
    const result = await main({});
    expect(result.body.registration.order).toHaveProperty("massActions");
    expect(Array.isArray(result.body.registration.order.massActions)).toBe(
      true,
    );
  });

  it('returns a massAction with actionId "hello-world", label "Hello World", and path "index.html#/hello-world"', async () => {
    const result = await main({});
    const massActions = result.body.registration.order.massActions;
    const EXPECTED_MASS_ACTION_COUNT = 1;
    expect(massActions).toHaveLength(EXPECTED_MASS_ACTION_COUNT);
    expect(massActions[0]).toEqual({
      actionId: "hello-world",
      label: "Hello World",
      path: "index.html#/hello-world",
    });
  });

  it("includes the extension id prefix delivery-fee-rules in every fee id", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "Fee A",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
      {
        country: "GB",
        region: "EN",
        name: "Fee B",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
    ]);
    const result = await main({});
    const fees = result.body.registration.order.customFees;
    for (const fee of fees) {
      expect(fee.id.startsWith("delivery-fee-rules::")).toBe(true);
    }
  });

  it("still returns order.customFees alongside the new massActions", async () => {
    stateService.listRules.mockResolvedValue([
      {
        country: "US",
        region: "CA",
        name: "Fee",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
    ]);
    const result = await main({});
    const order = result.body.registration.order;
    expect(Array.isArray(order.customFees)).toBe(true);
    expect(Array.isArray(order.massActions)).toBe(true);
    const EXPECTED_CUSTOM_FEES_COUNT = 1;
    expect(order.customFees).toHaveLength(EXPECTED_CUSTOM_FEES_COUNT);
    expect(order.customFees[0].id).toBe("delivery-fee-rules::us-ca");
    const EXPECTED_MASS_ACTION_COUNT = 1;
    expect(order.massActions).toHaveLength(EXPECTED_MASS_ACTION_COUNT);
    expect(order.massActions[0].actionId).toBe("hello-world");
  });
});
