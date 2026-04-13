import { register } from "@adobe/uix-guest";
import { render, waitFor } from "@testing-library/react";
import React from "react";

import { ExtensionRegistration } from "../../../src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration";

jest.mock("@adobe/uix-guest", () => ({
  register: jest.fn(),
}));

const EXTENSION_ID = "delivery-fee-rules";

beforeEach(() => {
  register.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ExtensionRegistration", () => {
  it("calls register on mount", async () => {
    render(React.createElement(ExtensionRegistration, null));

    await waitFor(() => {
      expect(register).toHaveBeenCalledTimes(1);
    });
  });

  it("calls register with the correct extension id delivery-fee-rules", async () => {
    render(React.createElement(ExtensionRegistration, null));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ id: EXTENSION_ID }),
      );
    });
  });

  it("calls register with an empty methods object", async () => {
    render(React.createElement(ExtensionRegistration, null));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ methods: {} }),
      );
    });
  });

  it("does not render any DOM elements", () => {
    const { container } = render(
      React.createElement(ExtensionRegistration, null),
    );

    expect(container.firstChild).toBeNull();
  });

  it("catches and logs errors from register without throwing", async () => {
    register.mockRejectedValue(new Error("registration failed"));

    let renderError = null;
    try {
      render(React.createElement(ExtensionRegistration, null));
      // Wait for the async init to settle
      await waitFor(() => {
        expect(register).toHaveBeenCalledTimes(1);
      });
    } catch (_err) {
      renderError = _err;
    }

    expect(renderError).toBeNull();
  });
});
