/**
 * Task 010 verification tests.
 * These tests verify that all requirements for task 010 are met.
 */
const fs = require("node:fs");
const path = require("node:path");

const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../..");
const EXT_CONFIG_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/ext.config.yaml",
);

const RULE_LIST_TEST_PATH = path.join(
  ROOT,
  "test/web-src/components/RuleList.test.jsx",
);
const RULE_FORM_TEST_PATH = path.join(
  ROOT,
  "test/web-src/components/RuleForm.test.jsx",
);
const DELETE_CONFIRM_TEST_PATH = path.join(
  ROOT,
  "test/web-src/components/DeleteConfirm.test.jsx",
);
const API_TEST_PATH = path.join(ROOT, "test/web-src/utils/api.test.js");
const EXC_APP_MOCK_PATH = path.join(ROOT, "test/__mocks__/@adobe/exc-app.js");

describe("Task 010 requirements", () => {
  let extConfig;

  beforeAll(() => {
    extConfig = yaml.load(fs.readFileSync(EXT_CONFIG_PATH, "utf8"));
  });

  it("scaffolding test asserts ext.config.yaml web is string web-src", () => {
    expect(typeof extConfig.web).toBe("string");
    expect(extConfig.web).toBe("web-src");
  });

  it("scaffolding test asserts ext.config.yaml actions field is string actions", () => {
    expect(extConfig.actions).toBe("actions");
  });

  it("RuleList test file does not exist", () => {
    expect(fs.existsSync(RULE_LIST_TEST_PATH)).toBe(false);
  });

  it("RuleForm test file does not exist", () => {
    expect(fs.existsSync(RULE_FORM_TEST_PATH)).toBe(false);
  });

  it("DeleteConfirm test file does not exist", () => {
    expect(fs.existsSync(DELETE_CONFIRM_TEST_PATH)).toBe(false);
  });

  it("api utility test file does not exist", () => {
    expect(fs.existsSync(API_TEST_PATH)).toBe(false);
  });

  it("@adobe/exc-app mock exists at test/__mocks__/@adobe/exc-app.js", () => {
    expect(fs.existsSync(EXC_APP_MOCK_PATH)).toBe(true);
  });
});
