import { register } from "@adobe/uix-guest";

const EXTENSION_ID = "delivery-fee-rules";

const CUSTOM_FEES_ROUTE = "/custom-fees-config";

const init = async () => {
  await register({
    id: EXTENSION_ID,
    methods: {},
  });
  window.location.hash = CUSTOM_FEES_ROUTE;
};

export default function ExtensionRegistration() {
  init().catch((_err) => {
    // error is intentionally caught to prevent unhandled rejection
  });
}

export { ExtensionRegistration };
