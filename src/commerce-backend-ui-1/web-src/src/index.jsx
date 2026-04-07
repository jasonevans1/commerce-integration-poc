import "core-js/stable";
import "regenerator-runtime/runtime";

import Runtime, { init } from "@adobe/exc-app";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

window.React = require("react");

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

function bootstrapRaw() {
  renderApp(
    {
      on: () => {
        /* intentionally empty — mock runtime event handler */
      },
    },
    {},
  );
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
