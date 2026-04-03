import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const MOCK_TOKEN = "mock-token";
const MOCK_COUNTRY = "US";
const MOCK_REGION = "CA";
const MOCK_FEE_VALUE = 5.99;
const EXTRA_FEE_VALUE = 3.5;
const EXPECTED_ROW_COUNT_WITH_HEADER = 3;
const EXPECTED_LIST_CALLS_AFTER_DELETE = 2;

const LOADING_PATTERN = /loading/i;
const FAILED_PATTERN = /failed to load rules/i;
const NO_RULES_PATTERN = /no rules found/i;

const SAMPLE_RULE = {
  country: MOCK_COUNTRY,
  region: MOCK_REGION,
  name: "California Fee",
  type: "fixed",
  value: MOCK_FEE_VALUE,
};

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/utils/api.js",
  () => ({
    listRules: jest.fn(),
    deleteRule: jest.fn(),
  }),
);

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/utils/GuestConnectionContext.js",
  () => ({
    useImsToken: jest.fn(() => MOCK_TOKEN),
  }),
);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock(
  "../../../src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx",
  () => ({
    __esModule: true,
    default: ({ onConfirm, onCancel }) => (
      <div data-testid="delete-confirm">
        <button onClick={onConfirm} type="button">
          Confirm Delete
        </button>
        <button onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    ),
  }),
);

const api = require("../../../src/commerce-backend-ui-1/web-src/src/utils/api.js");

describe("RuleList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading indicator while fetching rules", () => {
    api.listRules.mockReturnValue(
      new Promise(() => {
        /* intentionally never resolves */
      }),
    );

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    expect(screen.getByText(LOADING_PATTERN)).toBeInTheDocument();
  });

  it("renders a table row for each rule returned by the API", async () => {
    const rules = [
      {
        country: "US",
        region: "CA",
        name: "California Fee",
        type: "fixed",
        value: MOCK_FEE_VALUE,
      },
      {
        country: "US",
        region: "NY",
        name: "New York Fee",
        type: "fixed",
        value: EXTRA_FEE_VALUE,
      },
    ];
    api.listRules.mockResolvedValue(rules);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(
        EXPECTED_ROW_COUNT_WITH_HEADER,
      );
    });
  });

  it("displays country, region, name, type, and value columns for each rule", async () => {
    api.listRules.mockResolvedValue([SAMPLE_RULE]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText(MOCK_COUNTRY)).toBeInTheDocument();
      expect(screen.getByText(MOCK_REGION)).toBeInTheDocument();
      expect(screen.getByText("California Fee")).toBeInTheDocument();
      expect(screen.getByText("fixed")).toBeInTheDocument();
      expect(screen.getByText(String(MOCK_FEE_VALUE))).toBeInTheDocument();
    });
  });

  it("shows an empty state message when no rules exist", async () => {
    api.listRules.mockResolvedValue([]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText(NO_RULES_PATTERN)).toBeInTheDocument();
    });
  });

  it("shows an error message when the API call fails", async () => {
    api.listRules.mockRejectedValue(new Error("Network error"));

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText(FAILED_PATTERN)).toBeInTheDocument();
    });
  });

  it("opens the delete confirmation dialog when the delete button is clicked", async () => {
    api.listRules.mockResolvedValue([SAMPLE_RULE]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
  });

  it("calls deleteRule and refreshes the list after confirming deletion", async () => {
    api.listRules.mockResolvedValue([SAMPLE_RULE]);
    api.deleteRule.mockResolvedValue(undefined);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();

    await act(() => {
      fireEvent.click(screen.getByText("Confirm Delete"));
    });

    expect(api.deleteRule).toHaveBeenCalledWith(
      MOCK_TOKEN,
      MOCK_COUNTRY,
      MOCK_REGION,
    );
    expect(api.listRules).toHaveBeenCalledTimes(
      EXPECTED_LIST_CALLS_AFTER_DELETE,
    );
  });

  it("dismisses the dialog without deleting when cancel is clicked", async () => {
    api.listRules.mockResolvedValue([SAMPLE_RULE]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByTestId("delete-confirm")).not.toBeInTheDocument();
    expect(api.deleteRule).not.toHaveBeenCalled();
  });

  it("navigates to the edit route when the edit button is clicked", async () => {
    api.listRules.mockResolvedValue([SAMPLE_RULE]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Edit"));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/rules/edit/${MOCK_COUNTRY}/${MOCK_REGION}`,
    );
  });

  it("renders a Create New Rule button that navigates to the create route", async () => {
    api.listRules.mockResolvedValue([]);

    const RuleList =
      require("../../../src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx").default;

    render(<RuleList />);

    await waitFor(() => {
      expect(screen.getByText("Create New Rule")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create New Rule"));

    expect(mockNavigate).toHaveBeenCalledWith("/rules/new");
  });
});
