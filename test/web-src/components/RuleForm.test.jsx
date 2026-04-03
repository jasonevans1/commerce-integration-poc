import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RuleForm from "../../../src/commerce-backend-ui-1/web-src/src/components/RuleForm";

const LABEL_COUNTRY = /country/i;
const LABEL_REGION = /region/i;
const LABEL_NAME = /name/i;
const LABEL_TYPE = /type/i;
const LABEL_VALUE = /value/i;
const TEXT_SAVE = /save/i;
const TEXT_COUNTRY_REQUIRED = /country is required/i;
const TEXT_REGION_REQUIRED = /region is required/i;
const TEXT_NAME_REQUIRED = /name is required/i;
const TEXT_POSITIVE_NUMBER = /value must be a positive number/i;
const TEXT_PERCENTAGE_EXCEED = /percentage value must not exceed 100/i;
const TEXT_TYPE_REQUIRED = /type must be fixed or percentage/i;
const TEXT_LOADING = /loading/i;
const TEXT_NETWORK_ERROR = /Network error/i;
const MOCK_FEE_VALUE = 5;

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/utils/api.js",
  () => ({
    createRule: jest.fn(),
    getRule: jest.fn(),
  }),
);

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/utils/GuestConnectionContext.js",
  () => ({
    useImsToken: jest.fn(() => "mock-token"),
  }),
);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: () => mockNavigate,
}));

const { useParams } = require("react-router-dom");
const api = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

describe("RuleForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders blank fields in create mode", () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    expect(screen.getByLabelText(LABEL_COUNTRY)).toHaveValue("");
    expect(screen.getByLabelText(LABEL_REGION)).toHaveValue("");
    expect(screen.getByLabelText(LABEL_NAME)).toHaveValue("");
    expect(screen.getByLabelText(LABEL_TYPE)).toHaveValue("");
    expect(screen.getByLabelText(LABEL_VALUE)).toHaveValue(null);
  });

  it("fetches and pre-populates the rule fields in edit mode", async () => {
    useParams.mockReturnValue({ country: "US", region: "CA" });
    api.getRule.mockResolvedValue({
      country: "US",
      region: "CA",
      name: "Test Rule",
      type: "fixed",
      value: MOCK_FEE_VALUE,
    });

    render(<RuleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(LABEL_COUNTRY)).toHaveValue("US");
      expect(screen.getByLabelText(LABEL_REGION)).toHaveValue("CA");
      expect(screen.getByLabelText(LABEL_NAME)).toHaveValue("Test Rule");
      expect(screen.getByLabelText(LABEL_TYPE)).toHaveValue("fixed");
      expect(screen.getByLabelText(LABEL_VALUE)).toHaveValue(MOCK_FEE_VALUE);
    });
  });

  it("makes country and region fields read-only in edit mode", async () => {
    useParams.mockReturnValue({ country: "US", region: "CA" });
    api.getRule.mockResolvedValue({
      country: "US",
      region: "CA",
      name: "Test Rule",
      type: "fixed",
      value: MOCK_FEE_VALUE,
    });

    render(<RuleForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(LABEL_COUNTRY)).toHaveAttribute("readOnly");
      expect(screen.getByLabelText(LABEL_REGION)).toHaveAttribute("readOnly");
    });
  });

  it("shows a validation error when country is empty on submit", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_COUNTRY_REQUIRED)).toBeInTheDocument();
    });
  });

  it("shows a validation error when region is empty on submit", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_REGION_REQUIRED)).toBeInTheDocument();
    });
  });

  it("shows a validation error when name is empty on submit", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_NAME_REQUIRED)).toBeInTheDocument();
    });
  });

  it("shows a validation error when value is not a positive number", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    await userEvent.selectOptions(screen.getByLabelText(LABEL_TYPE), "fixed");
    await userEvent.type(screen.getByLabelText(LABEL_VALUE), "-1");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_POSITIVE_NUMBER)).toBeInTheDocument();
    });
  });

  it("shows a validation error when type is percentage and value exceeds 100", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    await userEvent.selectOptions(
      screen.getByLabelText(LABEL_TYPE),
      "percentage",
    );
    await userEvent.type(screen.getByLabelText(LABEL_VALUE), "150");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_PERCENTAGE_EXCEED)).toBeInTheDocument();
    });
  });

  it("shows a validation error when type is not selected", async () => {
    useParams.mockReturnValue({});
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_TYPE_REQUIRED)).toBeInTheDocument();
    });
  });

  it("calls createRule with the form data on valid submit", async () => {
    useParams.mockReturnValue({});
    api.createRule.mockResolvedValue({ success: true });
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    await userEvent.selectOptions(screen.getByLabelText(LABEL_TYPE), "fixed");
    await userEvent.type(screen.getByLabelText(LABEL_VALUE), "5");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(api.createRule).toHaveBeenCalledWith("mock-token", {
        country: "US",
        region: "CA",
        name: "Test Rule",
        type: "fixed",
        value: "5",
      });
    });
  });

  it("navigates to the rule list after successful submit", async () => {
    useParams.mockReturnValue({});
    api.createRule.mockResolvedValue({ success: true });
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    await userEvent.selectOptions(screen.getByLabelText(LABEL_TYPE), "fixed");
    await userEvent.type(screen.getByLabelText(LABEL_VALUE), "5");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error message when the API call fails", async () => {
    useParams.mockReturnValue({});
    api.createRule.mockRejectedValue(new Error("Network error"));
    render(<RuleForm />);

    await userEvent.type(screen.getByLabelText(LABEL_COUNTRY), "US");
    await userEvent.type(screen.getByLabelText(LABEL_REGION), "CA");
    await userEvent.type(screen.getByLabelText(LABEL_NAME), "Test Rule");
    await userEvent.selectOptions(screen.getByLabelText(LABEL_TYPE), "fixed");
    await userEvent.type(screen.getByLabelText(LABEL_VALUE), "5");
    fireEvent.click(screen.getByRole("button", { name: TEXT_SAVE }));

    await waitFor(() => {
      expect(screen.getByText(TEXT_NETWORK_ERROR)).toBeInTheDocument();
    });
  });

  it("shows a loading indicator while fetching the rule in edit mode", async () => {
    useParams.mockReturnValue({ country: "US", region: "CA" });
    let resolveGetRule;
    api.getRule.mockReturnValue(
      new Promise((resolve) => {
        resolveGetRule = resolve;
      }),
    );

    render(<RuleForm />);

    expect(screen.getByText(TEXT_LOADING)).toBeInTheDocument();

    resolveGetRule({
      country: "US",
      region: "CA",
      name: "Test Rule",
      type: "fixed",
      value: MOCK_FEE_VALUE,
    });

    await waitFor(() => {
      expect(screen.queryByText(TEXT_LOADING)).not.toBeInTheDocument();
    });
  });
});
