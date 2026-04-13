import { register } from "@adobe/uix-guest";

const EXTENSION_ID = "delivery-fee-rules";

const init = async () => {
  await register({
    id: EXTENSION_ID,
    methods: {},
  });
};

export default function ExtensionRegistration() {
  init().catch((_err) => {
    // error is intentionally caught to prevent unhandled rejection
  });
}

export { ExtensionRegistration };
