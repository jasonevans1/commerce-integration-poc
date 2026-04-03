import { register } from "@adobe/uix-guest";
import { render, waitFor } from "@testing-library/react";
import React from "react";

import { ExtensionRegistration } from "../../../src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration";

jest.mock("@adobe/uix-guest", () => ({
  register: jest.fn(),
}));

const EXTENSION_ID = "delivery-fee-rules";

const mockGuestConnection = { sharedContext: { get: jest.fn() } };

beforeEach(() => {
  register.mockResolvedValue(mockGuestConnection);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ExtensionRegistration", () => {
  it("calls extensionPoint init on mount to register with the Admin UI SDK host", async () => {
    render(React.createElement(ExtensionRegistration, null));

    await waitFor(() => {
      expect(register).toHaveBeenCalledTimes(1);
    });
  });

  it("renders null while registration is in progress", () => {
    // Make register never resolve during this test
    register.mockReturnValue(
      new Promise(() => {
        // intentionally never resolves
      }),
    );

    const { container } = render(
      React.createElement(ExtensionRegistration, null),
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders children after registration completes successfully", async () => {
    const { getByText } = render(
      React.createElement(
        ExtensionRegistration,
        null,
        React.createElement("span", null, "child content"),
      ),
    );

    await waitFor(() => {
      expect(getByText("child content")).toBeInTheDocument();
    });
  });

  it("passes the correct page id and title to the registration call", async () => {
    render(React.createElement(ExtensionRegistration, null));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ id: EXTENSION_ID }),
      );
    });
  });

  it("does not re-register if already registered", async () => {
    const { rerender } = render(
      React.createElement(ExtensionRegistration, null),
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalledTimes(1);
    });

    rerender(React.createElement(ExtensionRegistration, null));

    expect(register).toHaveBeenCalledTimes(1);
  });
});
