const fs = require("node:fs");
const path = require("node:path");

const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../..");
const EXT_CONFIG_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/ext.config.yaml",
);
const APP_CONFIG_PATH = path.join(ROOT, "app.config.yaml");
const WEB_SRC_PACKAGE_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/package.json",
);
const INDEX_HTML_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/public/index.html",
);

describe("Admin UI Phase 2 Scaffolding", () => {
  let extConfig;
  let appConfig;
  let webSrcPackage;
  let indexHtml;

  beforeAll(() => {
    extConfig = yaml.load(fs.readFileSync(EXT_CONFIG_PATH, "utf8"));
    appConfig = yaml.load(fs.readFileSync(APP_CONFIG_PATH, "utf8"));
    webSrcPackage = JSON.parse(fs.readFileSync(WEB_SRC_PACKAGE_PATH, "utf8"));
    indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  });

  test("ext.config.yaml declares the registration action with require-adobe-auth true and web yes", () => {
    const registrationAction =
      extConfig.runtimeManifest.packages["commerce-backend-ui-1"].actions
        .registration;

    expect(registrationAction).toBeDefined();
    expect(registrationAction.web).toBe("yes");
    expect(registrationAction.annotations["require-adobe-auth"]).toBe(true);
  });

  test("ext.config.yaml includes the web-src directory as the UI source", () => {
    expect(extConfig.web).toBeDefined();
    expect(extConfig.web.src).toBe("web-src/");
  });

  test("app.config.yaml includes the commerce/backend-ui/1 extension via ext.config.yaml", () => {
    expect(appConfig.extensions).toBeDefined();
    expect(appConfig.extensions["commerce/backend-ui/1"]).toBeDefined();
    const include = appConfig.extensions["commerce/backend-ui/1"].$include;
    expect(include).toBe("src/commerce-backend-ui-1/ext.config.yaml");
  });

  test("web-src/package.json lists @adobe/uix-guest as a dependency", () => {
    expect(webSrcPackage.dependencies["@adobe/uix-guest"]).toBeDefined();
  });

  test("web-src/package.json lists @adobe/react-spectrum packages as dependencies", () => {
    const deps = webSrcPackage.dependencies;
    const spectrumDeps = Object.keys(deps).filter((key) =>
      key.startsWith("@adobe/react-spectrum"),
    );
    expect(spectrumDeps.length).toBeGreaterThan(0);
  });

  test("web-src/package.json lists react-router-dom as a dependency", () => {
    expect(webSrcPackage.dependencies["react-router-dom"]).toBeDefined();
  });

  test("index.html has a root div with id root for React mounting", () => {
    expect(indexHtml).toContain('<div id="root">');
  });
});
