import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import CustomFeesConfig from "../../../src/commerce-backend-ui-1/web-src/src/components/CustomFeesConfig";
import { listRules } from "../../../src/commerce-backend-ui-1/web-src/src/utils/api";

const MOCK_FLAT_FEE_VALUE = 5;
const MOCK_PERCENTAGE_FEE_VALUE = 10;
const MOCK_ONTARIO_FEE_VALUE = 3;

jest.mock("../../../src/commerce-backend-ui-1/web-src/src/utils/api");

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/components/RuleForm",
  () => ({
    __esModule: true,
    default: (props) => {
      const mockReact = require("react");
      return mockReact.createElement("div", {
        "data-testid": "rule-form",
        onClick: () => props.onSuccess?.({}),
      });
    },
  }),
);

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm",
  () => ({
    __esModule: true,
    default: (props) => {
      const mockReact = require("react");
      return mockReact.createElement("div", {
        "data-testid": "delete-confirm",
        onClick: () => props.onConfirm?.(),
      });
    },
  }),
);

const EXPECTED_FETCH_COUNT_AFTER_REFRESH = 2;
const MOCK_TOKEN = "test-token";
const MOCK_ORG = "TEST123@AdobeOrg";
const MOCK_IMS = { token: MOCK_TOKEN, org: MOCK_ORG };

const MOCK_RULES = [
  {
    country: "US",
    region: "CA",
    name: "California Fee",
    type: "flat",
    value: MOCK_FLAT_FEE_VALUE,
  },
  {
    country: "US",
    region: "NY",
    name: "New York Fee",
    type: "percentage",
    value: MOCK_PERCENTAGE_FEE_VALUE,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CustomFeesConfig", () => {
  it("renders a loading indicator while fetching rules", () => {
    listRules.mockReturnValue(
      new Promise(() => {
        /* intentionally never resolves */
      }),
    );

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("renders the table with rule rows after successful fetch", async () => {
    listRules.mockResolvedValue(MOCK_RULES);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getByText("California Fee")).toBeInTheDocument();
    });

    expect(screen.getByText("New York Fee")).toBeInTheDocument();
    expect(screen.getAllByText("US").length).toBeGreaterThan(0);
    expect(screen.getByText("CA")).toBeInTheDocument();
  });

  it("renders an empty state message when no rules exist", async () => {
    listRules.mockResolvedValue([]);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(
        screen.getByText("No delivery fee rules found."),
      ).toBeInTheDocument();
    });
  });

  it("renders an error message when the API call fails", async () => {
    listRules.mockRejectedValue(new Error("Network error"));

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load rules. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("renders an Add Rule button", async () => {
    listRules.mockResolvedValue([]);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getByText("Add Rule")).toBeInTheDocument();
    });
  });

  it("opens the RuleForm modal when Add Rule is clicked", async () => {
    listRules.mockResolvedValue([]);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getByText("Add Rule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Rule"));

    expect(screen.getByTestId("rule-form")).toBeInTheDocument();
  });

  it("opens the RuleForm modal in edit mode when an Edit button is clicked", async () => {
    listRules.mockResolvedValue(MOCK_RULES);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getAllByText("Edit").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Edit")[0]);

    expect(screen.getByTestId("rule-form")).toBeInTheDocument();
  });

  it("opens the DeleteConfirm dialog when a Delete button is clicked", async () => {
    listRules.mockResolvedValue(MOCK_RULES);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getAllByText("Delete").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Delete")[0]);

    expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
  });

  it("refreshes the rule list after RuleForm is submitted", async () => {
    listRules.mockResolvedValueOnce(MOCK_RULES).mockResolvedValueOnce([
      ...MOCK_RULES,
      {
        country: "CA",
        region: "ON",
        name: "Ontario Fee",
        type: "flat",
        value: MOCK_ONTARIO_FEE_VALUE,
      },
    ]);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getByText("Add Rule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Add Rule"));

    const ruleForm = screen.getByTestId("rule-form");
    fireEvent.click(ruleForm);

    await waitFor(() => {
      expect(listRules).toHaveBeenCalledTimes(
        EXPECTED_FETCH_COUNT_AFTER_REFRESH,
      );
    });

    expect(screen.getByText("Ontario Fee")).toBeInTheDocument();
  });

  it("refreshes the rule list after a rule is deleted", async () => {
    listRules
      .mockResolvedValueOnce(MOCK_RULES)
      .mockResolvedValueOnce([MOCK_RULES[1]]);

    render(React.createElement(CustomFeesConfig, { ims: MOCK_IMS }));

    await waitFor(() => {
      expect(screen.getAllByText("Delete").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Delete")[0]);

    const deleteConfirm = screen.getByTestId("delete-confirm");
    fireEvent.click(deleteConfirm);

    await waitFor(() => {
      expect(listRules).toHaveBeenCalledTimes(
        EXPECTED_FETCH_COUNT_AFTER_REFRESH,
      );
    });

    expect(screen.queryByText("California Fee")).not.toBeInTheDocument();
  });
});
