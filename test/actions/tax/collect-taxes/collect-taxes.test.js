const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const yaml = require("js-yaml");

const CONFIG_PATH = path.resolve(
  __dirname,
  "../../../../actions/tax/actions.config.yaml",
);
const ACTION_DIR = path.resolve(
  __dirname,
  "../../../../actions/tax/collect-taxes",
);

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const HTTP_UNAUTHORIZED = 401;
const TAX_RATE_PERCENT = 8.5;
const TAX_RATE_PERCENT_STRING = "8.5";
const UNIT_PRICE_ITEM_1 = 100;
const UNIT_PRICE_ITEM_2 = 50;
const EXPECTED_TAX_ITEM_1 = 8.5;
const EXPECTED_TAX_ITEM_2 = 4.25;
const ROUNDING_UNIT_PRICE = 33.33;
const ROUNDING_TAX_RATE_PERCENT = 10;
const EXPECTED_ROUNDED_TAX = 3.33;
const ITEM_CODE_1 = "item_1";
const ITEM_CODE_2 = "item_2";
const ITEM_CODE_3 = "item_3";
const ITEM_QUANTITY = 1;

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("Given tax collect-taxes scaffold", () => {
  describe("it creates actions/tax/actions.config.yaml with collect-taxes entry with web yes, require-adobe-auth false, and final false", () => {
    it("it creates actions/tax/actions.config.yaml with collect-taxes entry with web yes, require-adobe-auth false, and final false", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["collect-taxes"];
      expect(entry).toBeDefined();
      expect(entry.web).toBe("yes");
      expect(entry.annotations["require-adobe-auth"]).toBe(false);
      expect(entry.annotations.final).toBe(false);
    });
  });

  describe("it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-taxes config entry", () => {
    it("it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-taxes config entry", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["collect-taxes"];
      expect(entry.inputs.TAX_RATE_PERCENT).toBe("$TAX_RATE_PERCENT");
      expect(entry.inputs.COMMERCE_WEBHOOKS_PUBLIC_KEY).toBe(
        "$COMMERCE_WEBHOOKS_PUBLIC_KEY",
      );
    });
  });

  describe("it creates all six handler files in actions/tax/collect-taxes/", () => {
    it("it creates all six handler files in actions/tax/collect-taxes/", () => {
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

  describe("it exports main from index.js", () => {
    it("it exports main from index.js", () => {
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

describe("Given tax collect-taxes action", () => {
  const makeParams = (overrides = {}) => ({
    oopQuote: {
      items: [
        {
          code: ITEM_CODE_1,
          name: "Product A",
          unit_price: UNIT_PRICE_ITEM_1,
          quantity: ITEM_QUANTITY,
          tax_class: "Taxable Goods",
        },
      ],
    },
    TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
    ...overrides,
  });

  describe("it returns 400 when required webhook payload fields are missing", () => {
    it("it returns 400 when required webhook payload fields are missing", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main({});
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("it returns 200 with tax amounts when valid quote payload is provided", () => {
    it("it returns 200 with tax amounts when valid quote payload is provided", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      expect(Array.isArray(ops)).toBe(true);
      expect(ops.length).toBeGreaterThan(0);
    });
  });

  describe("it calculates tax as TAX_RATE_PERCENT percent of taxable line item row_total values", () => {
    it("it calculates tax as TAX_RATE_PERCENT percent of taxable line item row_total values", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = makeParams({
        oopQuote: {
          items: [
            {
              code: ITEM_CODE_1,
              name: "Product A",
              unit_price: UNIT_PRICE_ITEM_1,
              quantity: ITEM_QUANTITY,
              tax_class: "Taxable Goods",
            },
            {
              code: ITEM_CODE_2,
              name: "Product B",
              unit_price: UNIT_PRICE_ITEM_2,
              quantity: ITEM_QUANTITY,
              tax_class: "Taxable Goods",
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
      });
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      const taxOp0 = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
      );
      const taxOp1 = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/1/tax",
      );
      expect(taxOp0.value.data.amount).toBe(EXPECTED_TAX_ITEM_1);
      expect(taxOp1.value.data.amount).toBe(EXPECTED_TAX_ITEM_2);
    });
  });

  describe("it coerces TAX_RATE_PERCENT from string to number before calculation", () => {
    it("it coerces TAX_RATE_PERCENT from string to number before calculation", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(
        makeParams({ TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING }),
      );
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      const taxOp = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
      );
      expect(taxOp.value.data.amount).toBe(EXPECTED_TAX_ITEM_1);
    });
  });

  describe("it rounds computed tax to 2 decimal places", () => {
    it("it rounds computed tax to 2 decimal places", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = makeParams({
        oopQuote: {
          items: [
            {
              code: ITEM_CODE_3,
              name: "Product C",
              unit_price: ROUNDING_UNIT_PRICE,
              quantity: ITEM_QUANTITY,
              tax_class: "Taxable Goods",
            },
          ],
        },
        TAX_RATE_PERCENT: String(ROUNDING_TAX_RATE_PERCENT),
      });
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      const taxOp = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
      );
      expect(taxOp.value.data.amount).toBe(EXPECTED_ROUNDED_TAX);
    });
  });

  describe("it returns 200 with zero tax when TAX_RATE_PERCENT is 0", () => {
    it("it returns 200 with zero tax when TAX_RATE_PERCENT is 0", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams({ TAX_RATE_PERCENT: "0" }));
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      const taxOp = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
      );
      expect(taxOp.value.data.amount).toBe(0);
    });
  });

  describe("it returns 200 with zero tax when TAX_RATE_PERCENT is unset", () => {
    it("it returns 200 with zero tax when TAX_RATE_PERCENT is unset", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const { TAX_RATE_PERCENT: _omit, ...paramsWithoutRate } = makeParams();
      const response = await action.main(paramsWithoutRate);
      expect(response.statusCode).toBe(HTTP_OK);
      const ops = JSON.parse(response.body);
      const taxOp = ops.find(
        (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
      );
      expect(taxOp.value.data.amount).toBe(0);
    });
  });

  describe("it returns 500 on unexpected internal errors", () => {
    it("it returns 500 on unexpected internal errors", async () => {
      jest.resetModules();
      jest.doMock(path.join(ACTION_DIR, "pre.js"), () => ({
        preProcess: () => {
          throw new Error("Unexpected failure");
        },
      }));
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_INTERNAL_ERROR);
      expect(response.body.error).toBe("Internal server error");
      jest.unmock(path.join(ACTION_DIR, "pre.js"));
      jest.resetModules();
    });
  });

  describe("it preProcess extracts the expected fields from the raw payload", () => {
    it("it preProcess extracts the expected fields from the raw payload", () => {
      const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
      const params = {
        oopQuote: {
          items: [
            {
              code: ITEM_CODE_1,
              name: "Product A",
              unit_price: UNIT_PRICE_ITEM_1,
              quantity: ITEM_QUANTITY,
              tax_class: "Taxable Goods",
            },
          ],
          ship_to_address: {
            country: "us",
            region_code: "ca",
          },
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
      };
      const result = preProcess(params);
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("taxRatePercent");
      expect(result).toHaveProperty("country");
      expect(result).toHaveProperty("region");
      expect(result.items).toEqual(params.oopQuote.items);
      expect(result.taxRatePercent).toBe(TAX_RATE_PERCENT);
      expect(result.country).toBe("US");
      expect(result.region).toBe("CA");
    });
  });
});

describe("Given tax collect-taxes pre.js address extraction", () => {
  const makeAddressParams = (overrides = {}) => ({
    oopQuote: {
      items: [
        {
          code: ITEM_CODE_1,
          name: "Product A",
          unit_price: UNIT_PRICE_ITEM_1,
          quantity: ITEM_QUANTITY,
          tax_class: "Taxable Goods",
        },
      ],
      ship_to_address: {
        country: "us",
        region_code: "ca",
      },
      ...overrides.oopQuoteExtra,
    },
    TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
    ...overrides,
  });

  it("it extracts country from oopQuote.ship_to_address.country and uppercases it", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const result = preProcess(makeAddressParams());
    expect(result.country).toBe("US");
  });

  it("it extracts region from oopQuote.ship_to_address.region_code and uppercases it", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const result = preProcess(makeAddressParams());
    expect(result.region).toBe("CA");
  });

  it("it returns country null and region empty string when ship_to_address is missing", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const params = {
      oopQuote: {
        items: [
          {
            code: ITEM_CODE_1,
            name: "Product A",
            unit_price: UNIT_PRICE_ITEM_1,
            quantity: ITEM_QUANTITY,
            tax_class: "Taxable Goods",
          },
        ],
      },
      TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
    };
    const result = preProcess(params);
    expect(result.country).toBeNull();
    expect(result.region).toBe("");
  });

  it("it returns country null and region empty string when ship_to_address.country is missing", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const params = {
      oopQuote: {
        items: [
          {
            code: ITEM_CODE_1,
            name: "Product A",
            unit_price: UNIT_PRICE_ITEM_1,
            quantity: ITEM_QUANTITY,
            tax_class: "Taxable Goods",
          },
        ],
        ship_to_address: { region_code: "CA" },
      },
      TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
    };
    const result = preProcess(params);
    expect(result.country).toBeNull();
    expect(result.region).toBe("CA");
  });

  it("it still extracts items and taxRatePercent alongside the address fields", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const result = preProcess(makeAddressParams());
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("taxRatePercent");
    expect(result.items).toHaveLength(1);
    expect(result.taxRatePercent).toBe(TAX_RATE_PERCENT);
  });

  it("it decodes base64 __ow_body before extracting address fields", () => {
    const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
    const rawBody = JSON.stringify({
      oopQuote: {
        items: [
          {
            code: ITEM_CODE_1,
            name: "Product A",
            unit_price: UNIT_PRICE_ITEM_1,
            quantity: ITEM_QUANTITY,
            tax_class: "Taxable Goods",
          },
        ],
        ship_to_address: {
          country: "gb",
          region_code: "eng",
        },
      },
    });
    const base64Body = Buffer.from(rawBody).toString("base64");
    const result = preProcess({
      __ow_body: base64Body,
      TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
    });
    expect(result.country).toBe("GB");
    expect(result.region).toBe("ENG");
  });
});

describe("Given collect-taxes validator.js ship_to_address handling", () => {
  it("it returns success true when oopQuote has items but no ship_to_address", () => {
    const { validateData } = require(path.join(ACTION_DIR, "validator.js"));
    const result = validateData({
      oopQuote: { items: [{ code: ITEM_CODE_1 }] },
    });
    expect(result.success).toBe(true);
  });

  it("it returns success true when oopQuote has items and a complete ship_to_address", () => {
    const { validateData } = require(path.join(ACTION_DIR, "validator.js"));
    const body = {
      oopQuote: {
        items: [{ code: ITEM_CODE_1 }],
        ship_to_address: { country: "US", region_code: "CA" },
      },
    };
    const params = {
      __ow_body: Buffer.from(JSON.stringify(body)).toString("base64"),
    };
    const result = validateData(params);
    expect(result.success).toBe(true);
  });

  it("it returns success true when ship_to_address is present but country is missing", () => {
    const { validateData } = require(path.join(ACTION_DIR, "validator.js"));
    const result = validateData({
      oopQuote: {
        items: [{ code: ITEM_CODE_1 }],
        ship_to_address: { region_code: "CA" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("it returns success false when oopQuote is missing", () => {
    const { validateData } = require(path.join(ACTION_DIR, "validator.js"));
    const result = validateData({});
    expect(result.success).toBe(false);
  });

  it("it returns success false when oopQuote.items is missing", () => {
    const { validateData } = require(path.join(ACTION_DIR, "validator.js"));
    const result = validateData({ oopQuote: {} });
    expect(result.success).toBe(false);
  });
});

describe("Given tax collect-taxes signature verification", () => {
  const RSA_KEY_BITS = 2048;
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: RSA_KEY_BITS,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const makeRawBody = () =>
    JSON.stringify({
      oopQuote: {
        items: [
          {
            code: ITEM_CODE_1,
            name: "Product A",
            unit_price: UNIT_PRICE_ITEM_1,
            quantity: ITEM_QUANTITY,
            tax_class: "Taxable Goods",
          },
        ],
      },
    });

  const makeBase64Body = () => Buffer.from(makeRawBody()).toString("base64");

  const signBody = (body) => {
    const sign = crypto.createSign("SHA256");
    sign.update(body);
    sign.end();
    return sign.sign(privateKey, "base64");
  };

  describe("it skips signature verification when COMMERCE_WEBHOOKS_PUBLIC_KEY is not set", () => {
    it("it skips signature verification when COMMERCE_WEBHOOKS_PUBLIC_KEY is not set", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = {
        oopQuote: {
          items: [
            {
              code: ITEM_CODE_1,
              name: "Product A",
              unit_price: UNIT_PRICE_ITEM_1,
              quantity: ITEM_QUANTITY,
              tax_class: "Taxable Goods",
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
    });
  });

  describe("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature header is missing or invalid", () => {
    it("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature header is missing or invalid", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = {
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
        COMMERCE_WEBHOOKS_PUBLIC_KEY: publicKey,
        __ow_headers: {
          "x-adobe-commerce-webhook-signature": "invalidsignature",
        },
        __ow_body: makeBase64Body(),
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_UNAUTHORIZED);
    });
  });

  describe("it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid", () => {
    it("it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const base64Body = makeBase64Body();
      const signature = signBody(base64Body);
      const params = {
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
        COMMERCE_WEBHOOKS_PUBLIC_KEY: publicKey,
        __ow_headers: {
          "x-adobe-commerce-webhook-signature": signature,
        },
        __ow_body: base64Body,
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
    });
  });
});

describe("Given collect-taxes sender.js", () => {
  const STATE_SERVICE_PATH = path.resolve(
    __dirname,
    "../../../../actions/delivery-fee/lib/state-service",
  );

  it("it calls getRule with the uppercased country and region from normalized params", async () => {
    const mockGetRule = jest.fn().mockResolvedValue({
      country: "US",
      region: "CA",
      name: "CA Fee",
      type: "fixed",
      value: 5,
    });
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    await sendData({ country: "US", region: "CA" });
    expect(mockGetRule).toHaveBeenCalledWith("US", "CA");
  });

  it("it returns the rule object when a matching rule exists in state", async () => {
    const rule = {
      country: "US",
      region: "CA",
      name: "CA Fee",
      type: "fixed",
      value: 5,
    };
    const mockGetRule = jest.fn().mockResolvedValue(rule);
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    const result = await sendData({ country: "US", region: "CA" });
    expect(result).toEqual(rule);
  });

  it("it returns null when no rule exists for the country and region", async () => {
    const mockGetRule = jest.fn().mockResolvedValue(null);
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    const result = await sendData({ country: "US", region: "TX" });
    expect(result).toBeNull();
  });

  it("it returns null without calling getRule when country is null", async () => {
    const mockGetRule = jest.fn();
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    const result = await sendData({ country: null, region: "CA" });
    expect(result).toBeNull();
    expect(mockGetRule).not.toHaveBeenCalled();
  });

  it("it returns null without calling getRule when country is empty string", async () => {
    const mockGetRule = jest.fn();
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    const result = await sendData({ country: "", region: "CA" });
    expect(result).toBeNull();
    expect(mockGetRule).not.toHaveBeenCalled();
  });

  it("it returns null when getRule throws (state outage must not block checkout)", async () => {
    const mockGetRule = jest
      .fn()
      .mockRejectedValue(new Error("State unavailable"));
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
    const result = await sendData({ country: "US", region: "CA" });
    expect(result).toBeNull();
  });
});

describe("Given collect-taxes transformer.js with delivery fee", () => {
  const ITEM_UNIT_PRICE_60 = 60;
  const ITEM_UNIT_PRICE_40 = 40;
  const ITEM_UNIT_PRICE_100 = 100;
  const ITEM_QTY_1 = 1;
  const TAX_RATE_10 = 10;
  const TAX_RATE_8_5 = 8.5;
  const FIXED_FEE_10 = 10;
  const FIXED_FEE_5 = 5;
  const PCT_FEE_10 = 10;
  const EXPECTED_ITEM1_FEE_FIXED_10 = 6;
  const EXPECTED_ITEM2_FEE_FIXED_10 = 4;
  const EXPECTED_ITEM1_COMBINED_10 = 12;
  const EXPECTED_ITEM2_COMBINED_10 = 8;
  const EXPECTED_SINGLE_COMBINED = 13.5;
  const TWO_DECIMAL_PLACES_FACTOR = 100;

  function makeNormalized(items, taxRatePercent) {
    return { items, taxRatePercent };
  }

  const twoItems = [
    { code: "item_1", unit_price: ITEM_UNIT_PRICE_60, quantity: ITEM_QTY_1 },
    { code: "item_2", unit_price: ITEM_UNIT_PRICE_40, quantity: ITEM_QTY_1 },
  ];

  const singleItem = [
    { code: "item_1", unit_price: ITEM_UNIT_PRICE_100, quantity: ITEM_QTY_1 },
  ];

  const fixedRule = {
    type: "fixed",
    value: FIXED_FEE_10,
    name: "CA Delivery Fee",
  };
  const pctRule = {
    type: "percentage",
    value: PCT_FEE_10,
    name: "PCT Delivery Fee",
  };
  const fixedRule5 = { type: "fixed", value: FIXED_FEE_5, name: "CA Fee" };

  it("it returns single tax_breakdown and tax ops per item when rule is null", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), null);
    const breakdownOps = ops.filter((op) => op.op === "add");
    const taxOps = ops.filter((op) => op.op === "replace");
    expect(breakdownOps).toHaveLength(twoItems.length);
    expect(taxOps).toHaveLength(twoItems.length);
  });

  it("it returns two tax_breakdown ops per item when a fixed fee rule matches", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), fixedRule);
    const breakdownOps = ops.filter((op) => op.op === "add");
    const taxOps = ops.filter((op) => op.op === "replace");
    expect(breakdownOps).toHaveLength(twoItems.length * 2);
    expect(taxOps).toHaveLength(twoItems.length);
  });

  it("it returns two tax_breakdown ops per item when a percentage fee rule matches", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), pctRule);
    const breakdownOps = ops.filter((op) => op.op === "add");
    const taxOps = ops.filter((op) => op.op === "replace");
    expect(breakdownOps).toHaveLength(twoItems.length * 2);
    expect(taxOps).toHaveLength(twoItems.length);
  });

  it("it sets delivery-fee tax_breakdown amount proportional to each item line subtotal for fixed rules", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), fixedRule);
    const feeBreakdown0 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/0/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    const feeBreakdown1 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/1/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown0.value.data.amount).toBe(EXPECTED_ITEM1_FEE_FIXED_10);
    expect(feeBreakdown1.value.data.amount).toBe(EXPECTED_ITEM2_FEE_FIXED_10);
  });

  it("it sets delivery-fee tax_breakdown amount as percentage of each item line subtotal for percentage rules", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), pctRule);
    const feeBreakdown0 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/0/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    const feeBreakdown1 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/1/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown0.value.data.amount).toBe(EXPECTED_ITEM1_FEE_FIXED_10);
    expect(feeBreakdown1.value.data.amount).toBe(EXPECTED_ITEM2_FEE_FIXED_10);
  });

  it("it assigns remainder to the last item so fee portions sum exactly to the total fee", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), fixedRule);
    const feeOps = ops.filter(
      (op) => op.op === "add" && op.value.data.code === "delivery-fee",
    );
    const total = feeOps.reduce((sum, op) => sum + op.value.data.amount, 0);
    expect(total).toBe(FIXED_FEE_10);
  });

  it("it includes both flat tax and fee portion in the replace tax amount", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(makeNormalized(twoItems, TAX_RATE_10), fixedRule);
    const taxOp0 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
    );
    const taxOp1 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/1/tax",
    );
    expect(taxOp0.value.data.amount).toBe(EXPECTED_ITEM1_COMBINED_10);
    expect(taxOp1.value.data.amount).toBe(EXPECTED_ITEM2_COMBINED_10);
  });

  it("it assigns entire fee to the first item when total subtotal is zero", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const zeroItems = [
      { code: "item_1", unit_price: 0, quantity: ITEM_QTY_1 },
      { code: "item_2", unit_price: 0, quantity: ITEM_QTY_1 },
    ];
    const ops = transformData(
      makeNormalized(zeroItems, TAX_RATE_10),
      fixedRule,
    );
    const feeBreakdown0 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/0/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    const feeBreakdown1 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/1/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown0.value.data.amount).toBe(FIXED_FEE_10);
    expect(feeBreakdown1.value.data.amount).toBe(0);
  });

  it("it uses rule.name as the title for the delivery-fee tax_breakdown", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(
      makeNormalized(singleItem, TAX_RATE_10),
      fixedRule,
    );
    const feeBreakdown = ops.find(
      (op) => op.op === "add" && op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown.value.data.title).toBe(fixedRule.name);
  });

  it('it uses "delivery-fee" as the code and tax_rate_key for the fee breakdown entry', () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(
      makeNormalized(singleItem, TAX_RATE_10),
      fixedRule5,
    );
    const feeBreakdown = ops.find(
      (op) => op.op === "add" && op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown.value.data.code).toBe("delivery-fee");
    expect(feeBreakdown.value.data.tax_rate_key).toBe("delivery-fee");
  });

  it("it rounds fee portions to 2 decimal places", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const THREE_ITEMS_PRICE = 33.33;
    const THREE_ITEMS_PRICE_2 = 33.34;
    const threeItems = [
      { code: "item_1", unit_price: THREE_ITEMS_PRICE, quantity: ITEM_QTY_1 },
      { code: "item_2", unit_price: THREE_ITEMS_PRICE, quantity: ITEM_QTY_1 },
      { code: "item_3", unit_price: THREE_ITEMS_PRICE_2, quantity: ITEM_QTY_1 },
    ];
    const ops = transformData(
      makeNormalized(threeItems, TAX_RATE_10),
      fixedRule,
    );
    const feeOps = ops.filter(
      (op) => op.op === "add" && op.value.data.code === "delivery-fee",
    );
    for (const op of feeOps) {
      const amount = op.value.data.amount;
      expect(Number.isFinite(amount)).toBe(true);
      expect(
        Math.round(amount * TWO_DECIMAL_PLACES_FACTOR) /
          TWO_DECIMAL_PLACES_FACTOR,
      ).toBe(amount);
    }
  });

  it("it rounds the combined tax amount (flat tax + fee) to 2 decimal places", () => {
    const { transformData } = require(path.join(ACTION_DIR, "transformer.js"));
    const ops = transformData(
      makeNormalized(singleItem, TAX_RATE_8_5),
      fixedRule5,
    );
    const taxOp = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
    );
    expect(taxOp.value.data.amount).toBe(EXPECTED_SINGLE_COMBINED);
    expect(
      Math.round(taxOp.value.data.amount * TWO_DECIMAL_PLACES_FACTOR) /
        TWO_DECIMAL_PLACES_FACTOR,
    ).toBe(taxOp.value.data.amount);
  });
});

describe("Given collect-taxes index.js with delivery fee wiring", () => {
  const STATE_SERVICE_PATH = path.resolve(
    __dirname,
    "../../../../actions/delivery-fee/lib/state-service",
  );

  const ITEM_UNIT_PRICE_60 = 60;
  const ITEM_UNIT_PRICE_40 = 40;
  const ITEM_QTY_1 = 1;
  const TAX_RATE_10 = 10;
  const FIXED_FEE_10 = 10;
  const EXPECTED_ITEM1_COMBINED_10 = 12;
  const EXPECTED_ITEM2_COMBINED_10 = 8;
  const EXPECTED_ITEM1_TAX_ONLY = 6;
  const EXPECTED_ITEM2_TAX_ONLY = 4;

  const fixedRule = {
    type: "fixed",
    value: FIXED_FEE_10,
    name: "CA Delivery Fee",
  };

  function makeParams(items, taxRate) {
    const payload = {
      oopQuote: {
        items,
        ship_to_address: { country: "us", region_code: "ca" },
      },
    };
    const base64Body = Buffer.from(JSON.stringify(payload)).toString("base64");
    return { __ow_body: base64Body, TAX_RATE_PERCENT: String(taxRate) };
  }

  function withRule(rule) {
    jest.resetModules();
    jest.doMock(STATE_SERVICE_PATH, () => ({
      getRule: jest.fn().mockResolvedValue(rule),
    }));
    return require(path.join(ACTION_DIR, "index.js"));
  }

  const twoItems = [
    {
      code: "item_1",
      name: "Product A",
      unit_price: ITEM_UNIT_PRICE_60,
      quantity: ITEM_QTY_1,
      tax_class: "Taxable Goods",
    },
    {
      code: "item_2",
      name: "Product B",
      unit_price: ITEM_UNIT_PRICE_40,
      quantity: ITEM_QTY_1,
      tax_class: "Taxable Goods",
    },
  ];

  it("it (in index.js) passes the rule returned by sendData into transformData as the second argument", async () => {
    const TRANSFORMER_PATH = path.resolve(
      __dirname,
      "../../../../actions/tax/collect-taxes/transformer.js",
    );
    jest.resetModules();
    const mockTransformData = jest.fn().mockReturnValue([]);
    jest.doMock(STATE_SERVICE_PATH, () => ({
      getRule: jest.fn().mockResolvedValue(fixedRule),
    }));
    jest.doMock(TRANSFORMER_PATH, () => ({
      transformData: mockTransformData,
    }));
    const action = require(path.join(ACTION_DIR, "index.js"));
    await action.main(makeParams(twoItems, TAX_RATE_10));
    expect(mockTransformData).toHaveBeenCalledWith(
      expect.any(Object),
      fixedRule,
    );
    jest.dontMock(TRANSFORMER_PATH);
    jest.resetModules();
  });

  it("it (in index.js) returns 200 with two-breakdown ops when sender returns a rule and items match", async () => {
    const action = withRule(fixedRule);
    const response = await action.main(makeParams(twoItems, TAX_RATE_10));
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length * 2);
    const taxOp0 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
    );
    const taxOp1 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/1/tax",
    );
    expect(taxOp0.value.data.amount).toBe(EXPECTED_ITEM1_COMBINED_10);
    expect(taxOp1.value.data.amount).toBe(EXPECTED_ITEM2_COMBINED_10);
  });

  it("it (in index.js) returns 200 with single-breakdown ops when sender returns null", async () => {
    const action = withRule(null);
    const response = await action.main(makeParams(twoItems, TAX_RATE_10));
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length);
    const taxOp0 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
    );
    const taxOp1 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/1/tax",
    );
    expect(taxOp0.value.data.amount).toBe(EXPECTED_ITEM1_TAX_ONLY);
    expect(taxOp1.value.data.amount).toBe(EXPECTED_ITEM2_TAX_ONLY);
  });
});

describe("Given collect-taxes end-to-end fee integration", () => {
  const STATE_SERVICE_PATH = path.resolve(
    __dirname,
    "../../../../actions/delivery-fee/lib/state-service",
  );

  const ITEM_UNIT_PRICE_60 = 60;
  const ITEM_UNIT_PRICE_40 = 40;
  const ITEM_QTY_1 = 1;
  const TAX_RATE_10 = 10;
  const FIXED_FEE_10 = 10;
  const PCT_FEE_10 = 10;
  const EXPECTED_ITEM1_FEE_FIXED_10 = 6;
  const EXPECTED_ITEM2_FEE_FIXED_10 = 4;
  const EXPECTED_ITEM1_COMBINED_10 = 12;
  const EXPECTED_ITEM2_COMBINED_10 = 8;

  const shipTo = {
    country: "us",
    region_code: "ca",
    city: "LA",
    postcode: "90001",
  };

  function makeBase64Params(items, taxRate, shipToAddr) {
    const payload = {
      oopQuote: {
        items,
        ...(shipToAddr ? { ship_to_address: shipToAddr } : {}),
      },
    };
    return {
      __ow_body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      TAX_RATE_PERCENT: String(taxRate),
    };
  }

  function withRule(rule) {
    jest.resetModules();
    jest.doMock(STATE_SERVICE_PATH, () => ({
      getRule: jest.fn().mockResolvedValue(rule),
    }));
    return require(path.join(ACTION_DIR, "index.js"));
  }

  function withRuleError(err) {
    jest.resetModules();
    jest.doMock(STATE_SERVICE_PATH, () => ({
      getRule: jest.fn().mockRejectedValue(err),
    }));
    return require(path.join(ACTION_DIR, "index.js"));
  }

  const twoItems = [
    { code: "item_1", unit_price: ITEM_UNIT_PRICE_60, quantity: ITEM_QTY_1 },
    { code: "item_2", unit_price: ITEM_UNIT_PRICE_40, quantity: ITEM_QTY_1 },
  ];

  const fixedRule = {
    type: "fixed",
    value: FIXED_FEE_10,
    name: "CA Delivery Fee",
  };
  const pctRule = {
    type: "percentage",
    value: PCT_FEE_10,
    name: "PCT Delivery Fee",
  };

  it("it calls getRule with uppercased country and region from ship_to_address", async () => {
    const mockGetRule = jest.fn().mockResolvedValue(null);
    jest.resetModules();
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const action = require(path.join(ACTION_DIR, "index.js"));
    const params = makeBase64Params(
      [
        {
          code: "item_1",
          unit_price: ITEM_UNIT_PRICE_60,
          quantity: ITEM_QTY_1,
        },
      ],
      TAX_RATE_10,
      { country: "us", region_code: "ca" },
    );
    await action.main(params);
    expect(mockGetRule).toHaveBeenCalledWith("US", "CA");
  });

  it("it returns two tax_breakdown ops per item when a percentage fee rule is returned", async () => {
    const action = withRule(pctRule);
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length * 2);
  });

  it("it distributes fixed fee proportionally across multiple items", async () => {
    const action = withRule(fixedRule);
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const feeBreakdown0 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/0/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    const feeBreakdown1 = ops.find(
      (op) =>
        op.op === "add" &&
        op.path === "oopQuote/items/1/tax_breakdown" &&
        op.value.data.code === "delivery-fee",
    );
    expect(feeBreakdown0.value.data.amount).toBe(EXPECTED_ITEM1_FEE_FIXED_10);
    expect(feeBreakdown1.value.data.amount).toBe(EXPECTED_ITEM2_FEE_FIXED_10);
  });

  it("it assigns remainder to last item so fee portions sum exactly to the rule value", async () => {
    const action = withRule(fixedRule);
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const feeOps = ops.filter(
      (op) => op.op === "add" && op.value.data.code === "delivery-fee",
    );
    const total = feeOps.reduce((sum, op) => sum + op.value.data.amount, 0);
    expect(total).toBe(FIXED_FEE_10);
  });

  it("it adds fee portion to the tax amount in the replace tax operation", async () => {
    const action = withRule(fixedRule);
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const taxOp0 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/0/tax",
    );
    const taxOp1 = ops.find(
      (op) => op.op === "replace" && op.path === "oopQuote/items/1/tax",
    );
    expect(taxOp0.value.data.amount).toBe(EXPECTED_ITEM1_COMBINED_10);
    expect(taxOp1.value.data.amount).toBe(EXPECTED_ITEM2_COMBINED_10);
  });

  it("it returns single tax_breakdown ops per item when getRule returns null", async () => {
    const action = withRule(null);
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length);
  });

  it("it does not call getRule when ship_to_address country is absent", async () => {
    const mockGetRule = jest.fn().mockResolvedValue(null);
    jest.resetModules();
    jest.doMock(STATE_SERVICE_PATH, () => ({ getRule: mockGetRule }));
    const action = require(path.join(ACTION_DIR, "index.js"));
    const params = makeBase64Params(twoItems, TAX_RATE_10, {
      region_code: "CA",
    });
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    expect(mockGetRule).not.toHaveBeenCalled();
  });

  it("it returns single tax_breakdown ops when no ship_to_address is present in payload", async () => {
    const action = withRule(null);
    const params = makeBase64Params(twoItems, TAX_RATE_10, null);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length);
  });

  it("it returns 200 (single tax_breakdown only) when getRule throws — checkout must not be blocked by state outage", async () => {
    const action = withRuleError(new Error("State service unavailable"));
    const params = makeBase64Params(twoItems, TAX_RATE_10, shipTo);
    const response = await action.main(params);
    expect(response.statusCode).toBe(HTTP_OK);
    const ops = JSON.parse(response.body);
    const breakdownOps = ops.filter((op) => op.op === "add");
    expect(breakdownOps).toHaveLength(twoItems.length);
  });
});
