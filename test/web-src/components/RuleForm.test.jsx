import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import RuleForm from "../../../src/commerce-backend-ui-1/web-src/src/components/RuleForm";
import {
  createRule,
  updateRule,
} from "../../../src/commerce-backend-ui-1/web-src/src/utils/api";

jest.mock("../../../src/commerce-backend-ui-1/web-src/src/utils/api");

const MOCK_TOKEN = "test-token";
const MOCK_ORG = "TEST123@AdobeOrg";
const MOCK_IMS = { token: MOCK_TOKEN, org: MOCK_ORG };

const MOCK_RULE_VALUE = 5;
const MOCK_BAVARIA_FEE_VALUE = 3;

const MOCK_RULE = {
  country: "US",
  region: "CA",
  name: "California Fee",
  type: "flat",
  value: MOCK_RULE_VALUE,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RuleForm", () => {
  it("renders all form fields: country, region, name, type, value", () => {
    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(screen.getByTestId("field-country")).toBeInTheDocument();
    expect(screen.getByTestId("field-region")).toBeInTheDocument();
    expect(screen.getByTestId("field-name")).toBeInTheDocument();
    expect(screen.getByTestId("field-type")).toBeInTheDocument();
    expect(screen.getByTestId("field-value")).toBeInTheDocument();
  });

  it("pre-fills form fields when a rule is provided (edit mode)", () => {
    render(
      React.createElement(RuleForm, {
        rule: MOCK_RULE,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(screen.getByTestId("field-country")).toHaveValue("US");
    expect(screen.getByTestId("field-region")).toHaveValue("CA");
    expect(screen.getByTestId("field-name")).toHaveValue("California Fee");
    expect(screen.getByTestId("field-type")).toHaveValue("flat");
    expect(screen.getByTestId("field-value")).toHaveValue(MOCK_RULE_VALUE);
  });

  it("renders empty fields when no rule is provided (create mode)", () => {
    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(screen.getByTestId("field-country")).toHaveValue("");
    expect(screen.getByTestId("field-region")).toHaveValue("");
    expect(screen.getByTestId("field-name")).toHaveValue("");
    expect(screen.getByTestId("field-type")).toHaveValue("");
    expect(screen.getByTestId("field-value")).toHaveValue(null);
  });

  it("calls createRule when submitted in create mode", async () => {
    createRule.mockResolvedValue({
      country: "DE",
      region: "BY",
      name: "Bavaria Fee",
      type: "flat",
      value: MOCK_BAVARIA_FEE_VALUE,
    });

    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    fireEvent.change(screen.getByTestId("field-country"), {
      target: { value: "DE" },
    });
    fireEvent.change(screen.getByTestId("field-region"), {
      target: { value: "BY" },
    });
    fireEvent.change(screen.getByTestId("field-name"), {
      target: { value: "Bavaria Fee" },
    });
    fireEvent.change(screen.getByTestId("field-type"), {
      target: { value: "flat" },
    });
    fireEvent.change(screen.getByTestId("field-value"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(createRule).toHaveBeenCalledWith(MOCK_IMS, {
        country: "DE",
        region: "BY",
        name: "Bavaria Fee",
        type: "flat",
        value: MOCK_BAVARIA_FEE_VALUE,
      });
    });
  });

  it("calls updateRule when submitted in edit mode", async () => {
    updateRule.mockResolvedValue(MOCK_RULE);

    render(
      React.createElement(RuleForm, {
        rule: MOCK_RULE,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(updateRule).toHaveBeenCalledWith(MOCK_IMS, MOCK_RULE);
    });
  });

  it("calls onSuccess with the saved rule after successful submission", async () => {
    const savedRule = {
      country: "DE",
      region: "BY",
      name: "Bavaria Fee",
      type: "flat",
      value: MOCK_BAVARIA_FEE_VALUE,
    };
    createRule.mockResolvedValue(savedRule);

    const onSuccess = jest.fn();

    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess,
        onCancel: jest.fn(),
      }),
    );

    fireEvent.change(screen.getByTestId("field-country"), {
      target: { value: "DE" },
    });
    fireEvent.change(screen.getByTestId("field-region"), {
      target: { value: "BY" },
    });
    fireEvent.change(screen.getByTestId("field-name"), {
      target: { value: "Bavaria Fee" },
    });
    fireEvent.change(screen.getByTestId("field-type"), {
      target: { value: "flat" },
    });
    fireEvent.change(screen.getByTestId("field-value"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(savedRule);
    });
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = jest.fn();

    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel,
      }),
    );

    fireEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows a validation error when a required field is empty", () => {
    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    fireEvent.click(screen.getByText("Save"));

    expect(screen.getAllByTestId("error").length).toBeGreaterThan(0);
    expect(createRule).not.toHaveBeenCalled();
  });

  it("shows a validation error when value is not a positive number", () => {
    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    fireEvent.change(screen.getByTestId("field-country"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByTestId("field-region"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("field-name"), {
      target: { value: "Test Fee" },
    });
    fireEvent.change(screen.getByTestId("field-type"), {
      target: { value: "flat" },
    });
    fireEvent.change(screen.getByTestId("field-value"), {
      target: { value: "0" },
    });

    fireEvent.click(screen.getByText("Save"));

    expect(screen.getAllByTestId("error").length).toBeGreaterThan(0);
    expect(createRule).not.toHaveBeenCalled();
  });

  it("disables the submit button while the API call is in progress", async () => {
    let resolveCreate;
    createRule.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    render(
      React.createElement(RuleForm, {
        rule: null,
        ims: MOCK_IMS,
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    fireEvent.change(screen.getByTestId("field-country"), {
      target: { value: "US" },
    });
    fireEvent.change(screen.getByTestId("field-region"), {
      target: { value: "CA" },
    });
    fireEvent.change(screen.getByTestId("field-name"), {
      target: { value: "Test Fee" },
    });
    fireEvent.change(screen.getByTestId("field-type"), {
      target: { value: "flat" },
    });
    fireEvent.change(screen.getByTestId("field-value"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Save")).toBeDisabled();

    resolveCreate({
      country: "US",
      region: "CA",
      name: "Test Fee",
      type: "flat",
      value: MOCK_RULE_VALUE,
    });

    await waitFor(() => {
      expect(screen.getByText("Save")).not.toBeDisabled();
    });
  });
});
