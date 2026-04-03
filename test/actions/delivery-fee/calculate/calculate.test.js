const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const FIXED_FEE_AMOUNT = 15;
const PERCENTAGE_FEE_RESULT = 10.0;
const NO_FEE_AMOUNT = 0;

const action = require("../../../../actions/delivery-fee/calculate/index");

jest.mock("../../../../actions/delivery-fee/lib/state-service");
const stateService = require("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("Given delivery-fee calculate action", () => {
  describe("it returns 400 when country is missing", () => {
    it("it returns 400 when country is missing", async () => {
      const params = { region: "CA", subtotal: 100, currency: "USD" };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 400 when region is missing", () => {
    it("it returns 400 when region is missing", async () => {
      const params = { country: "US", subtotal: 100, currency: "USD" };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 400 when subtotal is missing", () => {
    it("it returns 400 when subtotal is missing", async () => {
      const params = { country: "US", region: "CA", currency: "USD" };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 400 when currency is missing", () => {
    it("it returns 400 when currency is missing", async () => {
      const params = { country: "US", region: "CA", subtotal: 100 };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 400 when subtotal is not a positive number", () => {
    it("it returns 400 when subtotal is not a positive number", async () => {
      const params = {
        country: "US",
        region: "CA",
        subtotal: -5,
        currency: "USD",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it uppercases country and region before lookup", () => {
    it("it uppercases country and region before lookup", async () => {
      stateService.getRule.mockResolvedValue(null);
      const params = {
        country: "us",
        region: "ca",
        subtotal: 100,
        currency: "USD",
      };
      await action.main(params);
      expect(stateService.getRule).toHaveBeenCalledWith("US", "CA");
    });
  });

  describe("it returns fixed fee amount when rule type is fixed", () => {
    it("it returns fixed fee amount when rule type is fixed", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Delivery Fee",
        type: "fixed",
        value: 15,
      };
      stateService.getRule.mockResolvedValue(rule);
      const params = {
        country: "US",
        region: "CA",
        subtotal: 100,
        currency: "USD",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.fee).toBe(FIXED_FEE_AMOUNT);
      expect(response.body.name).toBe("CA Delivery Fee");
      expect(response.body.currency).toBe("USD");
    });
  });

  describe("it returns percentage-based fee rounded to 2 decimal places when rule type is percentage", () => {
    it("it returns percentage-based fee rounded to 2 decimal places when rule type is percentage", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Percentage Fee",
        type: "percentage",
        value: 10,
      };
      stateService.getRule.mockResolvedValue(rule);
      const params = {
        country: "US",
        region: "CA",
        subtotal: 99.99,
        currency: "USD",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.fee).toBe(PERCENTAGE_FEE_RESULT);
      expect(response.body.name).toBe("CA Percentage Fee");
    });
  });

  describe('it returns fee of 0 and name "No delivery fee applies" when no rule matches', () => {
    it('it returns fee of 0 and name "No delivery fee applies" when no rule matches', async () => {
      stateService.getRule.mockResolvedValue(null);
      const params = {
        country: "US",
        region: "CA",
        subtotal: 100,
        currency: "USD",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.fee).toBe(NO_FEE_AMOUNT);
      expect(response.body.name).toBe("No delivery fee applies");
      expect(response.body.currency).toBe("USD");
    });
  });

  describe("it returns 200 with fee, name, and currency on success", () => {
    it("it returns 200 with fee, name, and currency on success", async () => {
      const rule = {
        country: "US",
        region: "NY",
        name: "NY Fixed Fee",
        type: "fixed",
        value: 20,
      };
      stateService.getRule.mockResolvedValue(rule);
      const params = {
        country: "US",
        region: "NY",
        subtotal: 150,
        currency: "EUR",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toEqual({
        fee: 20,
        name: "NY Fixed Fee",
        currency: "EUR",
      });
    });
  });

  describe("it returns 500 with error message when state service throws", () => {
    it("it returns 500 with error message when state service throws", async () => {
      stateService.getRule.mockRejectedValue(new Error("State unavailable"));
      const params = {
        country: "US",
        region: "CA",
        subtotal: 100,
        currency: "USD",
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_INTERNAL_ERROR);
      expect(response.body.error).toBe("Internal server error");
    });
  });
});
