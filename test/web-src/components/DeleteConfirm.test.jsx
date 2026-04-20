import { fireEvent, render } from "@testing-library/react";
import React from "react";

import DeleteConfirm from "../../../src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm";

const RULE = { country: "US", region: "CA", name: "West Coast Fee" };
const COUNTRY_PATTERN = /US/;
const REGION_PATTERN = /CA/;
const DELETE_BUTTON_PATTERN = /delete/i;
const CANCEL_BUTTON_PATTERN = /cancel/i;
const EXPECTED_CALL_COUNT = 1;

describe("DeleteConfirm", () => {
  it("renders the rule country and region in the confirmation message", () => {
    const { getByText } = render(
      React.createElement(DeleteConfirm, {
        rule: RULE,
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(getByText(COUNTRY_PATTERN)).toBeInTheDocument();
    expect(getByText(REGION_PATTERN)).toBeInTheDocument();
  });

  it("renders a confirm delete button", () => {
    const { getByRole } = render(
      React.createElement(DeleteConfirm, {
        rule: RULE,
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(
      getByRole("button", { name: DELETE_BUTTON_PATTERN }),
    ).toBeInTheDocument();
  });

  it("renders a cancel button", () => {
    const { getByRole } = render(
      React.createElement(DeleteConfirm, {
        rule: RULE,
        onConfirm: jest.fn(),
        onCancel: jest.fn(),
      }),
    );

    expect(
      getByRole("button", { name: CANCEL_BUTTON_PATTERN }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm when the delete button is clicked", () => {
    const onConfirm = jest.fn();
    const { getByRole } = render(
      React.createElement(DeleteConfirm, {
        rule: RULE,
        onConfirm,
        onCancel: jest.fn(),
      }),
    );

    fireEvent.click(getByRole("button", { name: DELETE_BUTTON_PATTERN }));

    expect(onConfirm).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
  });

  it("calls onCancel when the cancel button is clicked", () => {
    const onCancel = jest.fn();
    const { getByRole } = render(
      React.createElement(DeleteConfirm, {
        rule: RULE,
        onConfirm: jest.fn(),
        onCancel,
      }),
    );

    fireEvent.click(getByRole("button", { name: CANCEL_BUTTON_PATTERN }));

    expect(onCancel).toHaveBeenCalledTimes(EXPECTED_CALL_COUNT);
  });
});
