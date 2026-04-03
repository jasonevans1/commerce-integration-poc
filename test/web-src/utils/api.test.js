const RULES_LIST_URL = "https://example.com/list";
const RULES_CREATE_URL = "https://example.com/create";
const RULES_GET_URL = "https://example.com/get";
const RULES_DELETE_URL = "https://example.com/delete";
const IMS_TOKEN = "test-ims-token";
const MOCK_FEE_CA = 5;
const MOCK_FEE_NY = 3;
const MOCK_FEE_TX = 4;
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;

beforeEach(() => {
  process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_LIST = RULES_LIST_URL;
  process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_CREATE = RULES_CREATE_URL;
  process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_GET = RULES_GET_URL;
  process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_DELETE = RULES_DELETE_URL;
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("listRules", () => {
  it("sends GET request to rules-list action URL with Authorization header", async () => {
    const {
      listRules,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_OK,
      json: jest.fn().mockResolvedValue([]),
    });

    await listRules(IMS_TOKEN);

    expect(global.fetch).toHaveBeenCalledWith(RULES_LIST_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${IMS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  });

  it("returns parsed JSON array of rules from listRules", async () => {
    const {
      listRules,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const mockRules = [
      { country: "US", region: "CA", fee: MOCK_FEE_CA },
      { country: "US", region: "NY", fee: MOCK_FEE_NY },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_OK,
      json: jest.fn().mockResolvedValue(mockRules),
    });

    const result = await listRules(IMS_TOKEN);

    expect(result).toEqual(mockRules);
  });
});

describe("createRule", () => {
  it("sends POST request to rules-create action URL with rule body and Authorization header", async () => {
    const {
      createRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const rule = { country: "US", region: "TX", fee: MOCK_FEE_TX };

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_CREATED,
      json: jest.fn().mockResolvedValue(rule),
    });

    await createRule(IMS_TOKEN, rule);

    expect(global.fetch).toHaveBeenCalledWith(RULES_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${IMS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rule),
    });
  });

  it("returns created rule object from createRule", async () => {
    const {
      createRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const rule = { country: "US", region: "TX", fee: MOCK_FEE_TX };

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_CREATED,
      json: jest.fn().mockResolvedValue(rule),
    });

    const result = await createRule(IMS_TOKEN, rule);

    expect(result).toEqual(rule);
  });
});

describe("getRule", () => {
  it("sends GET request to rules-get action URL with country and region query params", async () => {
    const {
      getRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const country = "US";
    const region = "CA";

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_OK,
      json: jest.fn().mockResolvedValue({ country, region, fee: MOCK_FEE_CA }),
    });

    await getRule(IMS_TOKEN, country, region);

    const expectedUrl = `${RULES_GET_URL}?country=${country}&region=${region}`;
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${IMS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  });

  it("returns rule object from getRule", async () => {
    const {
      getRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const country = "US";
    const region = "CA";
    const mockRule = { country, region, fee: MOCK_FEE_CA };

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_OK,
      json: jest.fn().mockResolvedValue(mockRule),
    });

    const result = await getRule(IMS_TOKEN, country, region);

    expect(result).toEqual(mockRule);
  });
});

describe("deleteRule", () => {
  it("sends DELETE request to rules-delete action URL with country and region query params", async () => {
    const {
      deleteRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    const country = "US";
    const region = "CA";

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_NO_CONTENT,
      json: jest.fn().mockResolvedValue(null),
    });

    await deleteRule(IMS_TOKEN, country, region);

    const expectedUrl = `${RULES_DELETE_URL}?country=${country}&region=${region}`;
    expect(global.fetch).toHaveBeenCalledWith(expectedUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${IMS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
  });

  it("resolves without value from deleteRule on success", async () => {
    const {
      deleteRule,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    global.fetch.mockResolvedValue({
      ok: true,
      status: HTTP_NO_CONTENT,
      json: jest.fn().mockResolvedValue(null),
    });

    const result = await deleteRule(IMS_TOKEN, "US", "CA");

    expect(result).toBeUndefined();
  });
});

describe("error handling", () => {
  it("throws an error when the action responds with a non-2xx status", async () => {
    const {
      listRules,
    } = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

    global.fetch.mockResolvedValue({
      ok: false,
      status: HTTP_BAD_REQUEST,
      json: jest.fn().mockResolvedValue({ error: "Bad Request" }),
    });

    await expect(listRules(IMS_TOKEN)).rejects.toThrow(`${HTTP_BAD_REQUEST}`);
  });
});
