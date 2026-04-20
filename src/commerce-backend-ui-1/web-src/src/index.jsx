import "core-js/stable";
import "regenerator-runtime/runtime";

import Runtime, { init } from "@adobe/exc-app";
import { attach } from "@adobe/uix-guest";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

window.React = require("react");

// Must match the ID used in ExtensionRegistration.jsx
const EXTENSION_ID = "delivery-fee-rules";

try {
  require("./exc-runtime");
  init(bootstrapInExcShell);
} catch (_e) {
  // biome-ignore lint/suspicious/noConsole: diagnostic log from Adobe ECS bootstrap pattern
  console.log("application not running in Adobe Experience Cloud Shell");
  bootstrapRaw();
}

function renderApp(runtime, ims) {
  const client = createRoot(document.getElementById("root"));
  client.render(<App ims={ims} runtime={runtime} />);
}

async function bootstrapRaw() {
  const mockRuntime = {
    on: () => {
      /* intentionally empty — mock runtime event handler */
    },
  };

  try {
    // In Commerce Admin menu page iframe, attach() provides IMS token via sharedContext
    const guestConnection = await attach({ id: EXTENSION_ID });
    const imsToken = guestConnection.sharedContext.get("imsToken");
    const imsOrgId = guestConnection.sharedContext.get("imsOrgId");
    renderApp(mockRuntime, imsToken ? { token: imsToken, org: imsOrgId } : {});
  } catch (_e) {
    // Not in an Admin UI SDK context — render without auth (e.g. direct URL access)
    renderApp(mockRuntime, {});
  }
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
