const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../../..");
const appConfigPath = path.join(ROOT, "app.config.yaml");
const actionsConfigPath = path.join(
  ROOT,
  "actions/delivery-fee/actions.config.yaml",
);

let appConfig;
let actionsConfig;

beforeAll(() => {
  appConfig = yaml.load(fs.readFileSync(appConfigPath, "utf8"));
  if (fs.existsSync(actionsConfigPath)) {
    actionsConfig = yaml.load(fs.readFileSync(actionsConfigPath, "utf8"));
  }
});

describe("app.config.yaml delivery-fee package", () => {
  it("includes delivery-fee package in app.config.yaml", () => {
    const packages = appConfig.application.runtimeManifest.packages;
    expect(packages).toHaveProperty("delivery-fee");
  });
});

describe("actions/delivery-fee/actions.config.yaml", () => {
  it("defines calculate action as a public web action with no adobe auth", () => {
    expect(actionsConfig).toBeDefined();
    expect(actionsConfig.calculate).toBeDefined();
    expect(actionsConfig.calculate.web).toBe("yes");
    expect(actionsConfig.calculate.annotations["require-adobe-auth"]).toBe(
      false,
    );
  });

  it("defines rules-create action as a public web action with no adobe auth", () => {
    expect(actionsConfig).toBeDefined();
    expect(actionsConfig["rules-create"]).toBeDefined();
    expect(actionsConfig["rules-create"].web).toBe("yes");
    expect(
      actionsConfig["rules-create"].annotations["require-adobe-auth"],
    ).toBe(false);
  });

  it("defines rules-get action as a public web action with no adobe auth", () => {
    expect(actionsConfig).toBeDefined();
    expect(actionsConfig["rules-get"]).toBeDefined();
    expect(actionsConfig["rules-get"].web).toBe("yes");
    expect(actionsConfig["rules-get"].annotations["require-adobe-auth"]).toBe(
      false,
    );
  });

  it("defines rules-delete action as a public web action with no adobe auth", () => {
    expect(actionsConfig).toBeDefined();
    expect(actionsConfig["rules-delete"]).toBeDefined();
    expect(actionsConfig["rules-delete"].web).toBe("yes");
    expect(
      actionsConfig["rules-delete"].annotations["require-adobe-auth"],
    ).toBe(false);
  });

  it("defines rules-list action as a public web action with no adobe auth", () => {
    expect(actionsConfig).toBeDefined();
    expect(actionsConfig["rules-list"]).toBeDefined();
    expect(actionsConfig["rules-list"].web).toBe("yes");
    expect(actionsConfig["rules-list"].annotations["require-adobe-auth"]).toBe(
      false,
    );
  });

  it("sets runtime to nodejs:22 for all actions", () => {
    expect(actionsConfig).toBeDefined();
    const actions = [
      "calculate",
      "rules-create",
      "rules-get",
      "rules-delete",
      "rules-list",
    ];
    for (const name of actions) {
      expect(actionsConfig[name]).toBeDefined();
      expect(actionsConfig[name].runtime).toBe("nodejs:22");
    }
  });
});
