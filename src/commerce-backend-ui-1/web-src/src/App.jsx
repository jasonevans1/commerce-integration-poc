import { lightTheme, Provider } from "@adobe/react-spectrum";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter, Route, Routes } from "react-router-dom";

import ExtensionRegistration from "./components/ExtensionRegistration.jsx";

function App(props) {
  props.runtime.on("configuration", () => {
    // intentionally empty — placeholder for org/token change handling
  });
  props.runtime.on("history", () => {
    // intentionally empty — placeholder for history change handling
  });

  return (
    <ErrorBoundary FallbackComponent={fallbackComponent} onError={onError}>
      <HashRouter>
        <Provider colorScheme={"light"} theme={lightTheme}>
          <Routes>
            <Route
              element={
                <ExtensionRegistration
                  ims={props.ims}
                  runtime={props.runtime}
                />
              }
              index
            />
          </Routes>
        </Provider>
      </HashRouter>
    </ErrorBoundary>
  );

  function onError(_e, _componentStack) {
    // intentionally empty — errors logged by ErrorBoundary
  }

  function fallbackComponent({ componentStack, error }) {
    return (
      <>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Something went wrong :(
        </h1>
        <pre>{`${componentStack}\n${error.message}`}</pre>
      </>
    );
  }
}

export default App;
