const HTTP_OK = 200;

describe("registration action", () => {
  let main;

  beforeEach(() => {
    jest.resetModules();
    main =
      require("../../../src/commerce-backend-ui-1/actions/registration/index").main;
  });

  it("it returns 200 with menu registration JSON when called with a valid IMS bearer token", async () => {
    const result = await main({
      __ow_headers: { authorization: "Bearer valid-ims-token" },
    });
    expect(result.statusCode).toBe(HTTP_OK);
    expect(result.body).toBeDefined();
  });

  it("it returns the menu id delivery-fee-rules in the response", async () => {
    const result = await main({});
    expect(result.body.pages[0].id).toBe("delivery-fee-rules");
  });

  it("it returns the menu label Delivery Fees in the response", async () => {
    const result = await main({});
    expect(result.body.pages[0].label).toBe("Delivery Fees");
  });

  it("it returns the menu parent Stores in the response", async () => {
    const result = await main({});
    expect(result.body.pages[0].parent).toBe("Stores");
  });

  it("it returns the menu icon Airplane in the response", async () => {
    const result = await main({});
    expect(result.body.pages[0].icon).toBe("Airplane");
  });
});
