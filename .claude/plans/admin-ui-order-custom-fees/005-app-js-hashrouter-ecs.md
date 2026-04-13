# Task 005: Update App.js — HashRouter, ECS Runtime, ErrorBoundary

**Status**: complete
**Depends on**: 003
**Retry count**: 0

## Description

Update `App.jsx` to match the sample: switch from `BrowserRouter` to `HashRouter`, accept `runtime` and `ims` props from the ECS bootstrap, add `react-error-boundary` with a fallback component, and route `ExtensionRegistration` at the root index path.

## Context

- File to modify: `src/commerce-backend-ui-1/web-src/src/App.jsx`
- Sample `App.js` pattern:

  ```js
  import { Provider, lightTheme } from '@adobe/react-spectrum'
  import { ErrorBoundary } from 'react-error-boundary'
  import { Route, Routes, HashRouter } from 'react-router-dom'
  import ExtensionRegistration from './ExtensionRegistration'

  function App(props) {
    props.runtime.on('configuration', ({ imsOrg, imsToken }) => { ... })
    props.runtime.on('history', ({ type, path }) => { ... })

    return (
      <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
        <HashRouter>
          <Provider theme={lightTheme} colorScheme={'light'}>
            <Routes>
              <Route index element={<ExtensionRegistration runtime={props.runtime} ims={props.ims} />} />
            </Routes>
          </Provider>
        </HashRouter>
      </ErrorBoundary>
    )

    function onError(e, componentStack) {}
    function fallbackComponent({ componentStack, error }) {
      return (
        <React.Fragment>
          <h1>Something went wrong :(</h1>
          <pre>{componentStack + '\n' + error.message}</pre>
        </React.Fragment>
      )
    }
  }
  ```

- Remove: `BrowserRouter`, `RuleList`, `RuleForm`, CRUD routes (`/rules/new`, `/rules/edit/:country/:region`)
- The `runtime` prop comes from the ECS bootstrap in `index.js` (Task 006)
- `ExtensionRegistration` is the root index route only

## Requirements (Test Descriptions)

- [x] `it renders without crashing given a mock runtime prop`
- [x] `it renders ExtensionRegistration at the root path`
- [x] `it uses HashRouter not BrowserRouter`
- [x] `it wraps content in ErrorBoundary`
- [x] `it registers runtime configuration event listener on mount`
- [x] `it registers runtime history event listener on mount`
- [x] `it renders error fallback when a child component throws`

## Acceptance Criteria

- All requirements have passing tests
- `BrowserRouter` import removed
- `HashRouter` from `react-router-dom` used
- `react-error-boundary` `ErrorBoundary` wraps the tree
- `runtime` and `ims` props accepted and passed through
- No CRUD routes present
- Note: root `package.json` has `react-router-dom` v7 in devDependencies while `web-src/package.json` has v6. Both export `HashRouter` with the same API. Tests will resolve v7 from root `node_modules`; deployed app will use v6 from web-src. Be aware of this discrepancy when debugging any routing issues.
