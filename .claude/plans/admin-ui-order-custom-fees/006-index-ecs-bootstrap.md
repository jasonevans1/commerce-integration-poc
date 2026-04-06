# Task 006: Replace index.jsx with ECS Bootstrap Pattern

**Status**: complete
**Depends on**: 003, 005
**Retry count**: 0

## Description

Replace the simple `ReactDOM.createRoot` in `index.jsx` with the Experience Cloud Shell bootstrap pattern from the sample. This handles two modes: running inside the ECS iframe (uses `@adobe/exc-app` init) and standalone fallback (mock runtime). Also add the required `exc-runtime.js` and `index.css` static files.

## Context

- File to rewrite: `src/commerce-backend-ui-1/web-src/src/index.jsx` (keep as `.jsx`)
- New file to create: `src/commerce-backend-ui-1/web-src/src/exc-runtime.js` (verbatim from sample)
- New file to create: `src/commerce-backend-ui-1/web-src/src/index.css` (from sample)
- Sample `index.js` pattern:

  ```js
  import "core-js/stable";
  import "regenerator-runtime/runtime";
  import { createRoot } from "react-dom/client";
  import Runtime, { init } from "@adobe/exc-app";
  import App from "./components/App";
  import "./index.css";

  window.React = require("react");

  try {
    require("./exc-runtime");
    init(bootstrapInExcShell);
  } catch (e) {
    console.log("application not running in Adobe Experience Cloud Shell");
    bootstrapRaw();
  }

  function renderApp(runtime, ims) {
    const client = createRoot(document.getElementById("root"));
    client.render(<App runtime={runtime} ims={ims} />);
  }

  function bootstrapRaw() {
    renderApp({ on: () => {} }, {});
  }

  function bootstrapInExcShell() {
    const runtime = Runtime();
    runtime.on("ready", ({ imsOrg, imsToken, imsProfile }) => {
      runtime.done();
      renderApp(runtime, { profile: imsProfile, org: imsOrg, token: imsToken });
    });
    runtime.solution = {
      icon: "AdobeExperienceCloud",
      title: "DeliveryFees",
      shortTitle: "DF",
    };
    runtime.title = "Delivery Fees";
  }
  ```

- `exc-runtime.js` content: copy verbatim from sample (minified script that loads ECS Module Runtime from iframe URL)
- `index.css` content: copy verbatim from sample (basic margin reset + SideNav styles)
- The mock runtime in `bootstrapRaw` must have an `on` function so `App.js` event listeners don't throw

## Requirements (Test Descriptions)

- [x] `exc-runtime.js exists at web-src/src/exc-runtime.js`
- [x] `index.css exists at web-src/src/index.css`
- [x] `index.jsx imports core-js/stable`
- [x] `index.jsx imports regenerator-runtime/runtime`
- [x] `index.jsx imports and uses @adobe/exc-app init`
- [x] `index.jsx sets window.React`
- [x] `index.jsx renders App with mock runtime when not in ECS shell`

## Acceptance Criteria

- All requirements have passing tests
- `exc-runtime.js` and `index.css` created verbatim from sample
- Entry point handles both ECS and standalone modes
- `window.React` assigned before render
- `BrowserRouter` removed (routing is now inside `App.jsx`)
- Note: `@adobe/exc-app`, `core-js`, and `regenerator-runtime` are NOT in root `node_modules`. Task 010 handles adding Jest mocks/moduleNameMapper for these. If testing this task independently, those mocks must exist first.
