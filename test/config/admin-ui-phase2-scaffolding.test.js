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
const INDEX_JSX_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/index.jsx",
);
const EXC_RUNTIME_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/exc-runtime.js",
);
const INDEX_CSS_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/index.css",
);
const APP_JSX_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/App.jsx",
);
const RULE_LIST_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx",
);
const RULE_FORM_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/components/RuleForm.jsx",
);
const DELETE_CONFIRM_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx",
);
const API_UTIL_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/utils/api.js",
);
const GUEST_CONTEXT_PATH = path.join(
  ROOT,
  "src/commerce-backend-ui-1/web-src/src/utils/GuestConnectionContext.js",
);

describe("Admin UI Phase 2 Scaffolding", () => {
  let extConfig;
  let appConfig;
  let webSrcPackage;
  let indexHtml;
  let indexJsx;
  let excRuntime;
  let indexCss;

  beforeAll(() => {
    extConfig = yaml.load(fs.readFileSync(EXT_CONFIG_PATH, "utf8"));
    appConfig = yaml.load(fs.readFileSync(APP_CONFIG_PATH, "utf8"));
    webSrcPackage = JSON.parse(fs.readFileSync(WEB_SRC_PACKAGE_PATH, "utf8"));
    indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf8");
    indexJsx = fs.readFileSync(INDEX_JSX_PATH, "utf8");
    excRuntime = fs.existsSync(EXC_RUNTIME_PATH);
    indexCss = fs.existsSync(INDEX_CSS_PATH);
  });

  test("ext.config.yaml declares the registration action with require-adobe-auth true and web yes", () => {
    const registrationAction =
      extConfig.runtimeManifest.packages["admin-ui-sdk"].actions.registration;

    expect(registrationAction).toBeDefined();
    expect(registrationAction.web).toBe("yes");
    expect(registrationAction.annotations["require-adobe-auth"]).toBe(true);
  });

  test('ext.config.yaml web field is the string "web-src" not a nested object', () => {
    expect(typeof extConfig.web).toBe("string");
    expect(extConfig.web).toBe("web-src");
  });

  test("ext.config.yaml declares actions field pointing to actions directory", () => {
    expect(extConfig.actions).toBe("actions");
  });

  test("ext.config.yaml operations view impl is index.html", () => {
    expect(extConfig.operations).toBeDefined();
    expect(extConfig.operations.view).toBeDefined();
    expect(extConfig.operations.view[0].impl).toBe("index.html");
  });

  test("ext.config.yaml runtimeManifest package is admin-ui-sdk with registration action", () => {
    expect(extConfig.runtimeManifest).toBeDefined();
    expect(extConfig.runtimeManifest.packages["admin-ui-sdk"]).toBeDefined();
    expect(
      extConfig.runtimeManifest.packages["admin-ui-sdk"].actions.registration,
    ).toBeDefined();
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

  test("web-src/package.json lists @adobe/exc-app as a dependency", () => {
    expect(webSrcPackage.dependencies["@adobe/exc-app"]).toBeDefined();
  });

  test("web-src/package.json lists @adobe/uix-core as a dependency", () => {
    expect(webSrcPackage.dependencies["@adobe/uix-core"]).toBeDefined();
  });

  test("web-src/package.json lists core-js as a dependency", () => {
    expect(webSrcPackage.dependencies["core-js"]).toBeDefined();
  });

  test("web-src/package.json lists regenerator-runtime as a dependency", () => {
    expect(webSrcPackage.dependencies["regenerator-runtime"]).toBeDefined();
  });

  test("web-src/package.json lists react-error-boundary as a dependency", () => {
    expect(webSrcPackage.dependencies["react-error-boundary"]).toBeDefined();
  });

  test("web-src/package.json lists @adobe/react-spectrum as a dependency", () => {
    expect(webSrcPackage.dependencies["@adobe/react-spectrum"]).toBeDefined();
  });

  test("index.html has a root div with id root for React mounting", () => {
    expect(indexHtml).toContain('<div id="root">');
  });

  test("exc-runtime.js exists at web-src/src/exc-runtime.js", () => {
    expect(excRuntime).toBe(true);
  });

  test("index.css exists at web-src/src/index.css", () => {
    expect(indexCss).toBe(true);
  });

  test("index.jsx imports core-js/stable", () => {
    expect(indexJsx).toContain("core-js/stable");
  });

  test("index.jsx imports regenerator-runtime/runtime", () => {
    expect(indexJsx).toContain("regenerator-runtime/runtime");
  });

  test("index.jsx imports and uses @adobe/exc-app init", () => {
    expect(indexJsx).toContain("@adobe/exc-app");
    expect(indexJsx).toContain("init");
  });

  test("index.jsx sets window.React", () => {
    expect(indexJsx).toContain("window.React");
  });

  test("index.jsx renders App with mock runtime when not in ECS shell", () => {
    expect(indexJsx).toContain("bootstrapRaw");
    expect(indexJsx).toContain("on:");
  });

  test("RuleList.jsx does not exist", () => {
    expect(fs.existsSync(RULE_LIST_PATH)).toBe(false);
  });

  test("RuleForm.jsx does not exist", () => {
    expect(fs.existsSync(RULE_FORM_PATH)).toBe(false);
  });

  test("DeleteConfirm.jsx does not exist", () => {
    expect(fs.existsSync(DELETE_CONFIRM_PATH)).toBe(false);
  });

  test("utils/api.js does not exist", () => {
    expect(fs.existsSync(API_UTIL_PATH)).toBe(false);
  });

  test("utils/GuestConnectionContext.js does not exist", () => {
    expect(fs.existsSync(GUEST_CONTEXT_PATH)).toBe(false);
  });

  test("App.jsx does not import RuleList", () => {
    const appJsx = fs.readFileSync(APP_JSX_PATH, "utf8");
    expect(appJsx).not.toContain("RuleList");
  });

  test("App.jsx does not import RuleForm", () => {
    const appJsx = fs.readFileSync(APP_JSX_PATH, "utf8");
    expect(appJsx).not.toContain("RuleForm");
  });

  test("App.jsx does not import DeleteConfirm", () => {
    const appJsx = fs.readFileSync(APP_JSX_PATH, "utf8");
    expect(appJsx).not.toContain("DeleteConfirm");
  });

  test("index.html contains a script tag with src pointing to ./src/index.jsx", () => {
    expect(indexHtml).toContain('src="./src/index.jsx"');
  });

  test("index.html contains the noscript fallback element", () => {
    expect(indexHtml).toContain("<noscript>");
  });

  test("index.html title is Delivery Fees", () => {
    expect(indexHtml).toContain("<title>Delivery Fees</title>");
  });

  test("index.html has X-UA-Compatible meta tag", () => {
    expect(indexHtml).toContain('http-equiv="X-UA-Compatible"');
  });
});
