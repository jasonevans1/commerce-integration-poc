/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: For testing purposes */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const BEARER_TOKEN_REGEX = /^Bearer /;

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const TAX_INTEGRATIONS_YAML = path.join(PROJECT_ROOT, "tax-integrations.yaml");
const CREATE_SCRIPT = path.join(
  PROJECT_ROOT,
  "scripts/create-tax-integrations.js",
);
const PACKAGE_JSON = path.join(PROJECT_ROOT, "package.json");

const HTTP_OK = 200;
const HTTP_CONFLICT = 409;

describe("create-tax-integrations", () => {
  describe("tax-integrations.yaml", () => {
    it("creates tax-integrations.yaml at the project root with a single flat-rate-tax entry with active true and stores default", () => {
      expect(fs.existsSync(TAX_INTEGRATIONS_YAML)).toBe(true);

      const content = fs.readFileSync(TAX_INTEGRATIONS_YAML, "utf8");
      const parsed = yaml.load(content);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);

      const entry = parsed[0];
      expect(entry.code).toBe("flat-rate-tax");
      expect(entry.active).toBe(true);
      expect(Array.isArray(entry.stores)).toBe(true);
      expect(entry.stores).toContain("default");
    });
  });

  describe("scripts/create-tax-integrations.js", () => {
    it("creates scripts/create-tax-integrations.js that exports a main function", () => {
      expect(fs.existsSync(CREATE_SCRIPT)).toBe(true);
      const script = require(CREATE_SCRIPT);
      expect(typeof script.main).toBe("function");
    });
  });

  describe("package.json", () => {
    it("adds create-tax-integrations script to package.json pointing to the create-tax-integrations.js script", () => {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
      expect(pkg.scripts["create-tax-integrations"]).toBeDefined();
      expect(pkg.scripts["create-tax-integrations"]).toContain(
        "create-tax-integrations.js",
      );
    });
  });

  describe("main function behaviour", () => {
    let createTaxIntegrations;
    let mockFetch;
    let mockGetAdobeAccessHeaders;

    beforeEach(() => {
      jest.resetModules();

      mockFetch = jest.fn();
      mockGetAdobeAccessHeaders = jest.fn().mockResolvedValue({
        Authorization: "Bearer test-ims-token",
        "x-api-key": "test-api-key",
      });

      jest.doMock("node-fetch", () => mockFetch);
      jest.doMock("../../utils/adobe-auth", () => ({
        getAdobeAccessHeaders: mockGetAdobeAccessHeaders,
      }));

      createTaxIntegrations = require(CREATE_SCRIPT);
    });

    afterEach(() => {
      jest.dontMock("node-fetch");
      jest.dontMock("../../utils/adobe-auth");
    });

    it("reads COMMERCE_BASE_URL and OAUTH_* (IMS) credentials from process.env", async () => {
      const mockEnv = {
        COMMERCE_BASE_URL: "https://commerce.test/",
        OAUTH_CLIENT_ID: "test-client-id",
        OAUTH_CLIENT_SECRET: "test-client-secret",
        OAUTH_TECHNICAL_ACCOUNT_ID: "test-tech-id",
        OAUTH_TECHNICAL_ACCOUNT_EMAIL: "test@example.com",
        OAUTH_ORG_ID: "test-org-id",
      };
      jest.replaceProperty(process, "env", mockEnv);

      mockFetch.mockResolvedValue({
        ok: true,
        status: HTTP_OK,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      });

      await createTaxIntegrations.main();

      expect(mockGetAdobeAccessHeaders).toHaveBeenCalledWith(
        expect.objectContaining({
          COMMERCE_BASE_URL: "https://commerce.test/",
          OAUTH_CLIENT_ID: "test-client-id",
          OAUTH_CLIENT_SECRET: "test-client-secret",
        }),
      );
    });

    it("uses the project's IMS auth pattern (getClient from actions/oauth1a.js or getAdobeAccessHeaders from actions/utils/adobe-auth.js) and sends an Authorization Bearer token", async () => {
      jest.replaceProperty(process, "env", {
        COMMERCE_BASE_URL: "https://commerce.test/",
        OAUTH_CLIENT_ID: "test-client-id",
        OAUTH_CLIENT_SECRET: "test-client-secret",
        OAUTH_TECHNICAL_ACCOUNT_ID: "test-tech-id",
        OAUTH_TECHNICAL_ACCOUNT_EMAIL: "test@example.com",
        OAUTH_ORG_ID: "test-org-id",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: HTTP_OK,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      });

      await createTaxIntegrations.main();

      expect(mockFetch).toHaveBeenCalled();
      const [, fetchOptions] = mockFetch.mock.calls[0];
      expect(fetchOptions.headers.Authorization).toMatch(BEARER_TOKEN_REGEX);
    });

    it("POSTs to /V1/oope_tax_management/tax_integration/:code for each tax integration entry", async () => {
      jest.replaceProperty(process, "env", {
        COMMERCE_BASE_URL: "https://commerce.test/",
        OAUTH_CLIENT_ID: "test-client-id",
        OAUTH_CLIENT_SECRET: "test-client-secret",
        OAUTH_TECHNICAL_ACCOUNT_ID: "test-tech-id",
        OAUTH_TECHNICAL_ACCOUNT_EMAIL: "test@example.com",
        OAUTH_ORG_ID: "test-org-id",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: HTTP_OK,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      });

      await createTaxIntegrations.main();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "V1/oope_tax_management/tax_integration/flat-rate-tax",
        ),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("logs success message with integration codes on successful creation", async () => {
      const consoleLogSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      jest.replaceProperty(process, "env", {
        COMMERCE_BASE_URL: "https://commerce.test/",
        OAUTH_CLIENT_ID: "test-client-id",
        OAUTH_CLIENT_SECRET: "test-client-secret",
        OAUTH_TECHNICAL_ACCOUNT_ID: "test-tech-id",
        OAUTH_TECHNICAL_ACCOUNT_EMAIL: "test@example.com",
        OAUTH_ORG_ID: "test-org-id",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: HTTP_OK,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      });

      await createTaxIntegrations.main();

      const allLogs = consoleLogSpy.mock.calls
        .map((c) => c.join(" "))
        .join(" ");
      expect(allLogs).toContain("flat-rate-tax");

      consoleLogSpy.mockRestore();
    });

    it("throws or logs a formatted error message when the Commerce API returns 4xx or 5xx (including conflict on duplicate active integration)", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      jest.replaceProperty(process, "env", {
        COMMERCE_BASE_URL: "https://commerce.test/",
        OAUTH_CLIENT_ID: "test-client-id",
        OAUTH_CLIENT_SECRET: "test-client-secret",
        OAUTH_TECHNICAL_ACCOUNT_ID: "test-tech-id",
        OAUTH_TECHNICAL_ACCOUNT_EMAIL: "test@example.com",
        OAUTH_ORG_ID: "test-org-id",
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: HTTP_CONFLICT,
        json: jest
          .fn()
          .mockResolvedValue({ message: "Integration already exists" }),
      });

      let threw = false;
      try {
        await createTaxIntegrations.main();
      } catch (_err) {
        threw = true;
      }

      if (!threw) {
        const allErrors = consoleErrorSpy.mock.calls
          .map((c) => c.join(" "))
          .join(" ");
        expect(allErrors).toContain("flat-rate-tax");
      }

      consoleErrorSpy.mockRestore();
    });
  });
});
