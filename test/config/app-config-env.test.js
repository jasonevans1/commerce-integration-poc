const fs = require("node:fs");
const path = require("node:path");

const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../..");
const APP_CONFIG_PATH = path.join(ROOT, "app.config.yaml");
const ENV_DIST_PATH = path.join(ROOT, "env.dist");
const COMMENT_LOOKBACK_LINES = 5;
const PREVIOUS_LINE_OFFSET = 1;

describe("app.config.yaml and env.dist configuration", () => {
  let appConfig;
  let envDist;

  beforeAll(() => {
    appConfig = yaml.load(fs.readFileSync(APP_CONFIG_PATH, "utf8"));
    envDist = fs.readFileSync(ENV_DIST_PATH, "utf8");
  });

  it("adds tax package to app.config.yaml with correct $include path", () => {
    const packages = appConfig.application.runtimeManifest.packages;

    expect(packages.tax).toBeDefined();
    expect(packages.tax.license).toBe("Apache-2.0");
    expect(packages.tax.actions.$include).toBe(
      "./actions/tax/actions.config.yaml",
    );
  });

  it("preserves the existing delivery-fee, starter-kit, and other packages in app.config.yaml", () => {
    const packages = appConfig.application.runtimeManifest.packages;

    expect(packages["starter-kit"]).toBeDefined();
    expect(packages["delivery-fee"]).toBeDefined();
    expect(packages.webhook).toBeDefined();
    expect(packages["product-commerce"]).toBeDefined();
    expect(packages["product-backoffice"]).toBeDefined();
    expect(packages["customer-commerce"]).toBeDefined();
    expect(packages["customer-backoffice"]).toBeDefined();
    expect(packages["company-commerce"]).toBeDefined();
    expect(packages["order-commerce"]).toBeDefined();
    expect(packages["order-backoffice"]).toBeDefined();
    expect(packages["stock-commerce"]).toBeDefined();
    expect(packages["stock-backoffice"]).toBeDefined();
  });

  it("adds TAX_RATE_PERCENT to env.dist with descriptive comment", () => {
    expect(envDist).toContain("TAX_RATE_PERCENT=");
    expect(envDist).toContain("TAX_RATE_PERCENT");
    // Must have a comment describing it
    const lines = envDist.split("\n");
    const taxRateLineIndex = lines.findIndex((line) =>
      line.startsWith("TAX_RATE_PERCENT="),
    );

    expect(taxRateLineIndex).toBeGreaterThan(0);
    // The line above should be a comment
    const commentLine = lines[taxRateLineIndex - PREVIOUS_LINE_OFFSET];

    expect(commentLine.startsWith("#")).toBe(true);
  });

  it("adds COMMERCE_WEBHOOKS_PUBLIC_KEY to env.dist with descriptive comment", () => {
    expect(envDist).toContain("COMMERCE_WEBHOOKS_PUBLIC_KEY=");
    const lines = envDist.split("\n");
    const keyLineIndex = lines.findIndex((line) =>
      line.startsWith("COMMERCE_WEBHOOKS_PUBLIC_KEY="),
    );

    expect(keyLineIndex).toBeGreaterThan(0);
    // There should be a comment somewhere above this line in the block
    const surroundingLines = lines.slice(
      Math.max(0, keyLineIndex - COMMENT_LOOKBACK_LINES),
      keyLineIndex,
    );
    const hasComment = surroundingLines.some((line) => line.startsWith("#"));

    expect(hasComment).toBe(true);
  });

  it("adds TAX_COLLECT_URL to env.dist with descriptive comment", () => {
    expect(envDist).toContain("TAX_COLLECT_URL=");
    const lines = envDist.split("\n");
    const urlLineIndex = lines.findIndex((line) =>
      line.startsWith("TAX_COLLECT_URL="),
    );

    expect(urlLineIndex).toBeGreaterThan(0);
    const surroundingLines = lines.slice(
      Math.max(0, urlLineIndex - COMMENT_LOOKBACK_LINES),
      urlLineIndex,
    );
    const hasComment = surroundingLines.some((line) => line.startsWith("#"));

    expect(hasComment).toBe(true);
  });

  it("adds TAX_COLLECT_ADJUSTMENT_URL to env.dist with descriptive comment", () => {
    expect(envDist).toContain("TAX_COLLECT_ADJUSTMENT_URL=");
    const lines = envDist.split("\n");
    const urlLineIndex = lines.findIndex((line) =>
      line.startsWith("TAX_COLLECT_ADJUSTMENT_URL="),
    );

    expect(urlLineIndex).toBeGreaterThan(0);
    const surroundingLines = lines.slice(
      Math.max(0, urlLineIndex - COMMENT_LOOKBACK_LINES),
      urlLineIndex,
    );
    const hasComment = surroundingLines.some((line) => line.startsWith("#"));

    expect(hasComment).toBe(true);
  });

  it("includes a comment in env.dist describing the two-step Commerce post-deploy setup (npm run create-tax-integrations + manual webhook registration)", () => {
    expect(envDist).toContain("create-tax-integrations");
    // Should mention manual webhook registration
    const lowerEnvDist = envDist.toLowerCase();

    expect(lowerEnvDist).toContain("webhook");
    expect(lowerEnvDist).toContain("manual");
  });
});
