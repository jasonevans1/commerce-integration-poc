const path = require("node:path");
const fs = require("node:fs");
const yaml = require("js-yaml");
const crypto = require("node:crypto");

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
const ROW_TOTAL_ITEM_1 = 100;
const ROW_TOTAL_ITEM_2 = 50;
const EXPECTED_TAX_ITEM_1 = 8.5;
const EXPECTED_TAX_ITEM_2 = 4.25;
const ROUNDING_ROW_TOTAL = 33.33;
const ROUNDING_TAX_RATE_PERCENT = 10;
const EXPECTED_ROUNDED_TAX = 3.33;
const ITEM_ID_1 = 1;
const ITEM_ID_2 = 2;
const ITEM_ID_3 = 3;
const TAX_CLASS_ID = 2;

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
    quote: {
      items: [
        {
          item_id: ITEM_ID_1,
          name: "Product A",
          row_total: ROW_TOTAL_ITEM_1,
          tax_class_id: TAX_CLASS_ID,
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
      expect(response.body).toHaveProperty("taxes");
      expect(Array.isArray(response.body.taxes)).toBe(true);
    });
  });

  describe("it calculates tax as TAX_RATE_PERCENT percent of taxable line item row_total values", () => {
    it("it calculates tax as TAX_RATE_PERCENT percent of taxable line item row_total values", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = makeParams({
        quote: {
          items: [
            {
              item_id: ITEM_ID_1,
              name: "Product A",
              row_total: ROW_TOTAL_ITEM_1,
              tax_class_id: TAX_CLASS_ID,
            },
            {
              item_id: ITEM_ID_2,
              name: "Product B",
              row_total: ROW_TOTAL_ITEM_2,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
      });
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes[0].amount).toBe(EXPECTED_TAX_ITEM_1);
      expect(response.body.taxes[1].amount).toBe(EXPECTED_TAX_ITEM_2);
    });
  });

  describe("it coerces TAX_RATE_PERCENT from string to number before calculation", () => {
    it("it coerces TAX_RATE_PERCENT from string to number before calculation", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(
        makeParams({ TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING }),
      );
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes[0].amount).toBe(EXPECTED_TAX_ITEM_1);
    });
  });

  describe("it rounds computed tax to 2 decimal places", () => {
    it("it rounds computed tax to 2 decimal places", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = makeParams({
        quote: {
          items: [
            {
              item_id: ITEM_ID_3,
              name: "Product C",
              row_total: ROUNDING_ROW_TOTAL,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: String(ROUNDING_TAX_RATE_PERCENT),
      });
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes[0].amount).toBe(EXPECTED_ROUNDED_TAX);
    });
  });

  describe("it returns 200 with zero tax when TAX_RATE_PERCENT is 0", () => {
    it("it returns 200 with zero tax when TAX_RATE_PERCENT is 0", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams({ TAX_RATE_PERCENT: "0" }));
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes[0].amount).toBe(0);
    });
  });

  describe("it returns 200 with zero tax when TAX_RATE_PERCENT is unset", () => {
    it("it returns 200 with zero tax when TAX_RATE_PERCENT is unset", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const { TAX_RATE_PERCENT: _omit, ...paramsWithoutRate } = makeParams();
      const response = await action.main(paramsWithoutRate);
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes[0].amount).toBe(0);
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

  describe("it sender returns the expected no-op shape", () => {
    it("it sender returns the expected no-op shape", async () => {
      const { sendData } = require(path.join(ACTION_DIR, "sender.js"));
      const result = await sendData({});
      expect(result).toBeNull();
    });
  });

  describe("it preProcess extracts the expected fields from the raw payload", () => {
    it("it preProcess extracts the expected fields from the raw payload", () => {
      const { preProcess } = require(path.join(ACTION_DIR, "pre.js"));
      const params = {
        quote: {
          items: [
            {
              item_id: ITEM_ID_1,
              name: "Product A",
              row_total: ROW_TOTAL_ITEM_1,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
      };
      const result = preProcess(params);
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("taxRatePercent");
      expect(result.items).toEqual(params.quote.items);
      expect(result.taxRatePercent).toBe(TAX_RATE_PERCENT);
    });
  });
});

describe("Given tax collect-taxes signature verification", () => {
  const RSA_KEY_BITS = 2048;
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: RSA_KEY_BITS,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const makeBody = () =>
    JSON.stringify({
      quote: {
        items: [
          {
            item_id: ITEM_ID_1,
            name: "Product A",
            row_total: ROW_TOTAL_ITEM_1,
            tax_class_id: TAX_CLASS_ID,
          },
        ],
      },
    });

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
        quote: {
          items: [
            {
              item_id: ITEM_ID_1,
              name: "Product A",
              row_total: ROW_TOTAL_ITEM_1,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
        // No COMMERCE_WEBHOOKS_PUBLIC_KEY
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
    });
  });

  describe("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature header is missing or invalid", () => {
    it("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature header is missing or invalid", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const params = {
        quote: {
          items: [
            {
              item_id: ITEM_ID_1,
              name: "Product A",
              row_total: ROW_TOTAL_ITEM_1,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
        COMMERCE_WEBHOOKS_PUBLIC_KEY: publicKey,
        __ow_headers: {
          "x-adobe-commerce-webhook-signature": "invalidsignature",
        },
        __ow_body: makeBody(),
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_UNAUTHORIZED);
    });
  });

  describe("it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid", () => {
    it("it accepts the request when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is valid", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const body = makeBody();
      const signature = signBody(body);
      const params = {
        quote: {
          items: [
            {
              item_id: ITEM_ID_1,
              name: "Product A",
              row_total: ROW_TOTAL_ITEM_1,
              tax_class_id: TAX_CLASS_ID,
            },
          ],
        },
        TAX_RATE_PERCENT: TAX_RATE_PERCENT_STRING,
        COMMERCE_WEBHOOKS_PUBLIC_KEY: publicKey,
        __ow_headers: {
          "x-adobe-commerce-webhook-signature": signature,
        },
        __ow_body: body,
      };
      const response = await action.main(params);
      expect(response.statusCode).toBe(HTTP_OK);
    });
  });
});
