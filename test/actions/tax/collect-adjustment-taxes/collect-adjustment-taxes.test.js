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
  "../../../../actions/tax/collect-adjustment-taxes",
);

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const HTTP_UNAUTHORIZED = 401;
const TAX_RATE_PERCENT_STRING = "8.5";
const ROW_TOTAL_ITEM_1 = 100;
const ITEM_ID_1 = 1;
const RSA_KEY_BITS = 2048;
const TAX_CLASS_ID = 2;

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("Given tax collect-adjustment-taxes scaffold", () => {
  describe("it appends collect-adjustment-taxes entry to actions/tax/actions.config.yaml with web yes, require-adobe-auth false, and final false", () => {
    it("it appends collect-adjustment-taxes entry to actions/tax/actions.config.yaml with web yes, require-adobe-auth false, and final false", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["collect-adjustment-taxes"];
      expect(entry).toBeDefined();
      expect(entry.web).toBe("yes");
      expect(entry.annotations["require-adobe-auth"]).toBe(false);
      expect(entry.annotations.final).toBe(false);
    });
  });

  describe("it preserves the existing collect-taxes entry in actions.config.yaml unchanged", () => {
    it("it preserves the existing collect-taxes entry in actions.config.yaml unchanged", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["collect-taxes"];
      expect(entry).toBeDefined();
      expect(entry.web).toBe("yes");
      expect(entry.annotations["require-adobe-auth"]).toBe(false);
      expect(entry.annotations.final).toBe(false);
    });
  });

  describe("it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-adjustment-taxes config entry", () => {
    it("it injects TAX_RATE_PERCENT and COMMERCE_WEBHOOKS_PUBLIC_KEY as inputs in the collect-adjustment-taxes config entry", () => {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const config = yaml.load(raw);
      const entry = config["collect-adjustment-taxes"];
      expect(entry.inputs.TAX_RATE_PERCENT).toBe("$TAX_RATE_PERCENT");
      expect(entry.inputs.COMMERCE_WEBHOOKS_PUBLIC_KEY).toBe(
        "$COMMERCE_WEBHOOKS_PUBLIC_KEY",
      );
    });
  });

  describe("it creates all six handler files in actions/tax/collect-adjustment-taxes/", () => {
    it("it creates all six handler files in actions/tax/collect-adjustment-taxes/", () => {
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

describe("Given tax collect-adjustment-taxes action", () => {
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

  describe("it returns 200 with valid adjustment tax response for a valid payload", () => {
    it("it returns 200 with valid adjustment tax response for a valid payload", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body).toHaveProperty("taxes");
      expect(Array.isArray(response.body.taxes)).toBe(true);
    });
  });

  describe("it returns zero-adjustment response for the flat-rate use case", () => {
    it("it returns zero-adjustment response for the flat-rate use case", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main(makeParams());
      expect(response.statusCode).toBe(HTTP_OK);
      expect(response.body.taxes).toEqual([]);
    });
  });

  describe("it returns 400 when required payload fields are missing", () => {
    it("it returns 400 when required payload fields are missing", async () => {
      const action = require(path.join(ACTION_DIR, "index.js"));
      const response = await action.main({});
      expect(response.statusCode).toBe(HTTP_BAD_REQUEST);
      expect(response.body.error).toBeDefined();
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
      expect(result.items).toEqual(params.quote.items);
    });
  });
});

describe("Given tax collect-adjustment-taxes signature verification", () => {
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

  describe("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is invalid", () => {
    it("it returns 401 when COMMERCE_WEBHOOKS_PUBLIC_KEY is set and the signature is invalid", async () => {
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
