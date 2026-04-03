const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

const action = require("../../../../actions/delivery-fee/rules-get/index");

jest.mock("../../../../actions/delivery-fee/lib/state-service");
const stateService = require("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("Given delivery-fee rules-get action", () => {
  it("it returns 400 when country query param is missing", async () => {
    const params = { region: "CA" };
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(response.body.error).toBeDefined();
  });

  it("it returns 400 when region query param is missing", async () => {
    const params = { country: "US" };
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
    expect(response.body.error).toBeDefined();
  });

  it("it uppercases country and region before lookup", async () => {
    stateService.getRule.mockResolvedValue(null);
    const params = { country: "us", region: "ca" };
    await action.main(params);
    expect(stateService.getRule).toHaveBeenCalledWith("US", "CA");
  });

  it("it returns 200 with rule object when rule exists", async () => {
    const rule = {
      country: "US",
      region: "CA",
      name: "CA Delivery Fee",
      type: "fixed",
      value: 15,
    };
    stateService.getRule.mockResolvedValue(rule);
    const params = { country: "US", region: "CA" };
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    expect(response.body.rule).toEqual(rule);
  });

  it("it returns 404 with error message when rule does not exist", async () => {
    stateService.getRule.mockResolvedValue(null);
    const params = { country: "US", region: "CA" };
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_NOT_FOUND);
    expect(response.body.error).toBe("Rule not found for US:CA");
  });

  it("it returns 500 with error message when state service throws", async () => {
    stateService.getRule.mockRejectedValue(new Error("State unavailable"));
    const params = { country: "US", region: "CA" };
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_INTERNAL_ERROR);
    expect(response.body.error).toBe("Internal server error");
  });
});
