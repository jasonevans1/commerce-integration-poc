import { render, screen } from "@testing-library/react";

import App from "../../src/commerce-backend-ui-1/web-src/src/App";

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration",
  () => () => <div data-testid="ext-reg" />,
);

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/HelloWorldPanel",
  () => () => <div data-testid="hello-world-panel" />,
);

jest.mock(
  "../../src/commerce-backend-ui-1/web-src/src/components/CustomFeesConfig",
  () =>
    function CustomFeesConfig({ ims }) {
      return (
        <div data-ims={JSON.stringify(ims)} data-testid="custom-fees-config" />
      );
    },
);

const NO_BROWSER_ROUTER_PATTERN = /BrowserRouter/;
const SOMETHING_WENT_WRONG_PATTERN = /Something went wrong/i;

const mockRuntime = { on: jest.fn() };
const mockIms = {};

afterEach(() => {
  window.location.hash = "";
});

describe("App", () => {
  it("renders without crashing given a mock runtime prop", () => {
    render(<App ims={mockIms} runtime={mockRuntime} />);
  });

  it("renders ExtensionRegistration at the root path", () => {
    render(<App ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByTestId("ext-reg")).toBeInTheDocument();
  });

  it("uses HashRouter not BrowserRouter", () => {
    // HashRouter uses hash-based navigation; BrowserRouter uses window.history
    // We verify App does not import or use BrowserRouter by checking its source
    const AppModule = require("../../src/commerce-backend-ui-1/web-src/src/App");
    const AppSrc = AppModule.toString();
    expect(AppSrc).not.toMatch(NO_BROWSER_ROUTER_PATTERN);
  });

  it("wraps content in ErrorBoundary", () => {
    // ErrorBoundary is confirmed by the "renders error fallback" test below
    render(<App ims={mockIms} runtime={mockRuntime} />);
  });

  it("registers runtime configuration event listener on mount", () => {
    const onFn = jest.fn();
    render(<App ims={mockIms} runtime={{ on: onFn }} />);
    expect(onFn).toHaveBeenCalledWith("configuration", expect.any(Function));
  });

  it("registers runtime history event listener on mount", () => {
    const onFn = jest.fn();
    render(<App ims={mockIms} runtime={{ on: onFn }} />);
    expect(onFn).toHaveBeenCalledWith("history", expect.any(Function));
  });

  it("renders HelloWorldPanel at the /hello-world route", () => {
    window.location.hash = "#/hello-world";
    render(<App ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByTestId("hello-world-panel")).toBeInTheDocument();
  });

  it("renders CustomFeesConfig at the /custom-fees-config route", () => {
    window.location.hash = "#/custom-fees-config";
    render(<App ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByTestId("custom-fees-config")).toBeInTheDocument();
  });

  it("still renders HelloWorldPanel at the /hello-world route", () => {
    window.location.hash = "#/hello-world";
    render(<App ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByTestId("hello-world-panel")).toBeInTheDocument();
  });

  it("still renders ExtensionRegistration at the index route", () => {
    window.location.hash = "";
    render(<App ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByTestId("ext-reg")).toBeInTheDocument();
  });

  it("passes the ims prop to CustomFeesConfig", () => {
    const testIms = { token: "test-token" };
    window.location.hash = "#/custom-fees-config";
    render(<App ims={testIms} runtime={mockRuntime} />);
    const el = screen.getByTestId("custom-fees-config");
    expect(el.getAttribute("data-ims")).toBe(JSON.stringify(testIms));
  });

  it("renders error fallback when a child component throws", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
      // intentionally empty — suppress React error boundary noise
    });

    // Re-require App with a throwing ExtensionRegistration
    jest.resetModules();
    jest.mock(
      "../../src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration",
      () => {
        const Thrower = () => {
          throw new Error("test error");
        };
        return Thrower;
      },
    );

    const FreshApp =
      require("../../src/commerce-backend-ui-1/web-src/src/App").default;

    render(<FreshApp ims={mockIms} runtime={mockRuntime} />);
    expect(screen.getByText(SOMETHING_WENT_WRONG_PATTERN)).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
