import { register } from "@adobe/uix-guest";
import React, { useEffect, useState } from "react";

import { GuestConnectionContext } from "../utils/GuestConnectionContext";

const EXTENSION_ID = "delivery-fee-rules";

const ExtensionRegistration = ({ children }) => {
  const [guestConnection, setGuestConnection] = useState(null);

  useEffect(() => {
    if (guestConnection) {
      return;
    }

    const initExtension = async () => {
      const connection = await register({
        id: EXTENSION_ID,
        methods: {},
      });
      setGuestConnection(connection);
    };

    initExtension();
  }, [guestConnection]);

  if (!guestConnection) {
    return null;
  }

  return React.createElement(
    GuestConnectionContext.Provider,
    { value: guestConnection },
    children,
  );
};

export { ExtensionRegistration };
export default ExtensionRegistration;
