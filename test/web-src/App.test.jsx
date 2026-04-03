import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import App from "../../src/commerce-backend-ui-1/web-src/src/App";

const NOT_FOUND_TEXT = /404 Not Found/i;

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration",
  () => ({
    __esModule: true,
    default: ({ children }) => (
      <div data-testid="extension-registration">{children}</div>
    ),
  }),
);

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/RuleList",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rule-list">RuleList</div>,
  }),
);

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/RuleForm",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rule-form">RuleForm</div>,
  }),
);

describe("App", () => {
  it("renders RuleList at the root path", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("rule-list")).toBeInTheDocument();
  });

  it("renders RuleForm in create mode at /rules/new", () => {
    render(
      <MemoryRouter initialEntries={["/rules/new"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("rule-form")).toBeInTheDocument();
  });

  it("renders RuleForm in edit mode at /rules/edit/:country/:region", () => {
    render(
      <MemoryRouter initialEntries={["/rules/edit/US/CA"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("rule-form")).toBeInTheDocument();
  });

  it("wraps all routes with ExtensionRegistration", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("extension-registration")).toBeInTheDocument();
  });

  it("renders a 404 not found message for unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
  });
});
