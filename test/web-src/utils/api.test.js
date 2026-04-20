import {
  createRule,
  deleteRule,
  listRules,
  updateRule,
} from "../../../src/commerce-backend-ui-1/web-src/src/utils/api";

const EXPECTED_RULES_LIST_URL =
  "https://291222-516bronzepike-stage.adobeio-static.net/api/v1/web/delivery-fee/rules-list";
const EXPECTED_RULES_CREATE_URL =
  "https://291222-516bronzepike-stage.adobeio-static.net/api/v1/web/delivery-fee/rules-create";
const EXPECTED_RULES_DELETE_URL =
  "https://291222-516bronzepike-stage.adobeio-static.net/api/v1/web/delivery-fee/rules-delete";
const MOCK_TOKEN = "mock-ims-bearer-token";
const MOCK_ORG = "ABCDEF123@AdobeOrg";
const MOCK_IMS = { token: MOCK_TOKEN, org: MOCK_ORG };
const MOCK_COUNTRY = "US";
const MOCK_REGION = "CA";
const MOCK_FEE_VALUE = 5;
const REGISTRATION_URL_MISSING_PATTERN = /registration URL/i;
const HTTP_STATUS_500 = 500;
const HTTP_STATUS_500_PATTERN = /500/;

const MOCK_RULE = {
  country: MOCK_COUNTRY,
  region: MOCK_REGION,
  name: "CA Delivery Fee",
  type: "flat",
  value: MOCK_FEE_VALUE,
};

const MOCK_RULES_LIST = [MOCK_RULE];

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/config.json",
  () => ({
    registration:
      "https://291222-516bronzepike-stage.adobeio-static.net/api/v1/web/admin-ui-sdk/registration",
    "admin-ui-sdk/registration":
      "https://291222-516bronzepike-stage.adobeio-static.net/api/v1/web/admin-ui-sdk/registration",
  }),
  { virtual: true },
);

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("api utility", () => {
  describe("listRules", () => {
    it("calls the rules-list action URL with a Bearer token and org ID", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rules: MOCK_RULES_LIST }),
      });

      await listRules(MOCK_IMS);

      expect(global.fetch).toHaveBeenCalledWith(
        EXPECTED_RULES_LIST_URL,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
            "x-gw-ims-org-id": MOCK_ORG,
          }),
        }),
      );
    });

    it("returns an array of rules from listRules", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rules: MOCK_RULES_LIST }),
      });

      const result = await listRules(MOCK_IMS);

      expect(result).toEqual(MOCK_RULES_LIST);
    });

    it("throws an error when the rules-list URL is missing from config", async () => {
      jest.resetModules();
      jest.mock(
        "../../../src/commerce-backend-ui-1/web-src/src/config.json",
        () => ({}),
        { virtual: true },
      );

      const { listRules: listRulesNoConfig } = await import(
        "../../../src/commerce-backend-ui-1/web-src/src/utils/api"
      );

      await expect(listRulesNoConfig(MOCK_IMS)).rejects.toThrow(
        REGISTRATION_URL_MISSING_PATTERN,
      );
    });

    it("throws an error when the response status is not ok", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: HTTP_STATUS_500,
        statusText: "Internal Server Error",
      });

      await expect(listRules(MOCK_IMS)).rejects.toThrow(
        HTTP_STATUS_500_PATTERN,
      );
    });
  });

  describe("createRule", () => {
    it("calls the rules-create action URL with the rule payload, Bearer token, and org ID", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rule: MOCK_RULE }),
      });

      await createRule(MOCK_IMS, MOCK_RULE);

      expect(global.fetch).toHaveBeenCalledWith(
        EXPECTED_RULES_CREATE_URL,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
            "x-gw-ims-org-id": MOCK_ORG,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(MOCK_RULE),
        }),
      );
    });

    it("returns the created rule from createRule", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rule: MOCK_RULE }),
      });

      const result = await createRule(MOCK_IMS, MOCK_RULE);

      expect(result).toEqual(MOCK_RULE);
    });
  });

  describe("updateRule", () => {
    it("calls the rules-create action URL with the updated rule payload for updateRule", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rule: MOCK_RULE }),
      });

      await updateRule(MOCK_IMS, MOCK_RULE);

      expect(global.fetch).toHaveBeenCalledWith(
        EXPECTED_RULES_CREATE_URL,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
            "x-gw-ims-org-id": MOCK_ORG,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(MOCK_RULE),
        }),
      );
    });
  });

  describe("deleteRule", () => {
    it("calls the rules-delete action URL with country and region for deleteRule", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await deleteRule(MOCK_IMS, MOCK_COUNTRY, MOCK_REGION);

      expect(global.fetch).toHaveBeenCalledWith(
        EXPECTED_RULES_DELETE_URL,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
            "x-gw-ims-org-id": MOCK_ORG,
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ country: MOCK_COUNTRY, region: MOCK_REGION }),
        }),
      );
    });
  });
});
