const path = require("node:path");
const fs = require("node:fs");
const yaml = require("js-yaml");

const CONFIG_PATH = path.resolve(
  __dirname,
  "../../../../actions/delivery-fee/actions.config.yaml",
);
const ACTION_DIR = path.resolve(
  __dirname,
  "../../../../actions/delivery-fee/webhook-quote-total",
);

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const FIXED_FEE_VALUE = 15;
const PERCENTAGE_FEE_RATE = 10;
const SUBTOTAL = 149;
const EXPECTED_PERCENTAGE_FEE = 14.9;
const EXPECTED_GRAND_TOTAL_WITH_FIXED_FEE = 164;
const EXPECTED_GRAND_TOTAL_WITH_PERCENTAGE_FEE = 163.9;
const GRAND_TOTAL = 149;
const EXPECTED_PATCH_LENGTH = 2;

jest.mock("../../../../actions/delivery-fee/lib/state-service");
const stateService = require("../../../../actions/delivery-fee/lib/state-service");

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given delivery-fee webhook-quote-total scaffold", () => {
  describe("it adds webhook-quote-total entry to actions.config.yaml with web yes and require-adobe-auth false", () => {
    it("it adds webhook-quote-total entry to actions.config.yaml with web yes and require-adobe-auth false", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["webhook-quote-total"];
      expect(entry).toBeDefined();
      expect(entry.web).toBe("yes");
      expect(entry.annotations["require-adobe-auth"]).toBe(false);
    });
  });

  describe("it creates all six handler files: index.js, validator.js, pre.js, transformer.js, sender.js, post.js", () => {
    it("it creates all six handler files: index.js, validator.js, pre.js, transformer.js, sender.js, post.js", () => {
      const files = [
        "index.js",
        "validator.js",
        "pre.js",
        "transformer.js",
        "sender.js",
        "post.js",
      ];
      for (const file of files) {
        const exists = fs.existsSync(path.join(ACTION_DIR, file));
        expect(exists).toBe(true);
      }
    });
  });

  describe("it exports main from index.js following the standard handler pattern", () => {
    it("it exports main from index.js following the standard handler pattern", () => {
      const mod = require(path.join(ACTION_DIR, "index.js"));
      expect(typeof mod.main).toBe("function");
    });
  });

  describe("it exports validateData from validator.js", () => {
    it("it exports validateData from validator.js", () => {
      const mod = require(path.join(ACTION_DIR, "validator.js"));
      expect(typeof mod.validateData).toBe("function");
    });
  });

  describe("it exports preProcess from pre.js", () => {
    it("it exports preProcess from pre.js", () => {
      const mod = require(path.join(ACTION_DIR, "pre.js"));
      expect(typeof mod.preProcess).toBe("function");
    });
  });

  describe("it exports transformData from transformer.js", () => {
    it("it exports transformData from transformer.js", () => {
      const mod = require(path.join(ACTION_DIR, "transformer.js"));
      expect(typeof mod.transformData).toBe("function");
    });
  });

  describe("it exports sendData from sender.js", () => {
    it("it exports sendData from sender.js", () => {
      const mod = require(path.join(ACTION_DIR, "sender.js"));
      expect(typeof mod.sendData).toBe("function");
    });
  });

  describe("it exports postProcess from post.js", () => {
    it("it exports postProcess from post.js", () => {
      const mod = require(path.join(ACTION_DIR, "post.js"));
      expect(typeof mod.postProcess).toBe("function");
    });
  });
});

describe("Given delivery-fee webhook-quote-total action", () => {
  let action;

  beforeEach(() => {
    action = require(path.join(ACTION_DIR, "index.js"));
  });

  const makeParams = (overrides = {}) => ({
    quote: {
      shipping_address: {
        country_id: "US",
        region_code: "CA",
      },
      subtotal: SUBTOTAL,
      base_currency_code: "USD",
    },
    totals: {
      grand_total: GRAND_TOTAL,
      total_segments: [
        { code: "subtotal", title: "Subtotal", value: SUBTOTAL },
      ],
    },
    ...overrides,
  });

  describe("it returns an empty patch array when no fee rule matches the shipping address", () => {
    it("it returns an empty patch array when no fee rule matches the shipping address", async () => {
      stateService.getRule.mockResolvedValue(null);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("it returns add and replace patch operations when a fixed fee rule matches", () => {
    it("it returns add and replace patch operations when a fixed fee rule matches", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Delivery Fee",
        type: "fixed",
        value: FIXED_FEE_VALUE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toHaveLength(EXPECTED_PATCH_LENGTH);
      expect(response.body[0].op).toBe("add");
      expect(response.body[0].path).toBe("/totals/total_segments/-");
      expect(response.body[1].op).toBe("replace");
      expect(response.body[1].path).toBe("/totals/grand_total");
    });
  });

  describe("it returns add and replace patch operations when a percentage fee rule matches", () => {
    it("it returns add and replace patch operations when a percentage fee rule matches", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Percentage Fee",
        type: "percentage",
        value: PERCENTAGE_FEE_RATE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toHaveLength(EXPECTED_PATCH_LENGTH);
      expect(response.body[0].op).toBe("add");
      expect(response.body[1].op).toBe("replace");
    });
  });

  describe("it computes percentage fee correctly as a percentage of the quote subtotal", () => {
    it("it computes percentage fee correctly as a percentage of the quote subtotal", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Percentage Fee",
        type: "percentage",
        value: PERCENTAGE_FEE_RATE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body[0].value.value).toBe(EXPECTED_PERCENTAGE_FEE);
      expect(response.body[1].value).toBe(
        EXPECTED_GRAND_TOTAL_WITH_PERCENTAGE_FEE,
      );
    });
  });

  describe("it returns 200 with empty patch array when quote shipping address is missing (pre-address checkout stage)", () => {
    it("it returns 200 with empty patch array when quote shipping address is missing (pre-address checkout stage)", async () => {
      const params = {
        quote: { subtotal: SUBTOTAL },
        totals: { grand_total: GRAND_TOTAL },
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("it returns 200 with empty patch array when country_id is missing from shipping address", () => {
    it("it returns 200 with empty patch array when country_id is missing from shipping address", async () => {
      const params = makeParams();
      params.quote.shipping_address.country_id = undefined;
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("it returns 400 when quote object is entirely absent from payload", () => {
    it("it returns 400 when quote object is entirely absent from payload", async () => {
      const response = await action.main({
        totals: { grand_total: GRAND_TOTAL },
      });
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 200 with empty patch array when region_code is absent (getRule with empty region returns no match)", () => {
    it("it returns 200 with empty patch array when region_code is absent (getRule with empty region returns no match)", async () => {
      stateService.getRule.mockResolvedValue(null);
      const params = makeParams();
      params.quote.shipping_address.region_code = undefined;
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toEqual([]);
    });
  });

  describe("it uppercases country_id and region_code before rule lookup", () => {
    it("it uppercases country_id and region_code before rule lookup", async () => {
      stateService.getRule.mockResolvedValue(null);
      const params = makeParams();
      params.quote.shipping_address.country_id = "us";
      params.quote.shipping_address.region_code = "ca";
      await action.main(params);
      expect(stateService.getRule).toHaveBeenCalledWith("US", "CA");
    });
  });

  describe("it returns 500 on state service failure without exposing internal error", () => {
    it("it returns 500 on state service failure without exposing internal error", async () => {
      stateService.getRule.mockRejectedValue(new Error("State unavailable"));
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_INTERNAL_ERROR);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("it sets the grand_total patch value to existing grand_total plus the fee", () => {
    it("it sets the grand_total patch value to existing grand_total plus the fee", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Delivery Fee",
        type: "fixed",
        value: FIXED_FEE_VALUE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body[1].value).toBe(EXPECTED_GRAND_TOTAL_WITH_FIXED_FEE);
    });
  });

  describe("it uses the rule name as the total segment title", () => {
    it("it uses the rule name as the total segment title", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "International Delivery Fee",
        type: "fixed",
        value: FIXED_FEE_VALUE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body[0].value.title).toBe("International Delivery Fee");
    });
  });

  describe("it uses delivery_fee as the total segment code", () => {
    it("it uses delivery_fee as the total segment code", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Delivery Fee",
        type: "fixed",
        value: FIXED_FEE_VALUE,
      };
      stateService.getRule.mockResolvedValue(rule);
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body[0].value.code).toBe("delivery_fee");
    });
  });
});
