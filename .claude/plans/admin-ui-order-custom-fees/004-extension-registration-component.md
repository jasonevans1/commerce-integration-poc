# Task 004: Replace ExtensionRegistration with Sample Plain-Function Pattern

**Status**: complete
**Depends on**: 003
**Retry count**: 0

## Description

Replace the current stateful React `ExtensionRegistration` component (which uses `useState`, `useEffect`, and `GuestConnectionContext`) with the sample's plain-function `init()` pattern. The new component is a non-rendering function that fires `register()` on mount via `init().catch(console.error)`.

## Context

- File to rewrite: `src/commerce-backend-ui-1/web-src/src/components/ExtensionRegistration.jsx` (keep as `.jsx` for project consistency)
- Sample pattern:

  ```js
  import { register } from "@adobe/uix-guest";

  export default function ExtensionRegistration() {
    init().catch(console.error);
  }

  const init = async () => {
    await register({
      id: "delivery-fee-rules",
      methods: {},
    });
  };
  ```

- Extension ID must be `'delivery-fee-rules'` (matches `extension-manifest.json` `"id": "delivery-fee-rules"`)
- Remove all: `useState`, `useEffect`, `GuestConnectionContext` usage
- The component renders nothing (returns undefined) — the `App.js` `<Route>` renders it at the root path
- Do NOT rename to `.js` -- keep `.jsx` since the project uses JSX throughout and biome overrides target `*.{js,jsx}`

## Requirements (Test Descriptions)

- [x] `it calls register on mount`
- [x] `it calls register with the correct extension id delivery-fee-rules`
- [x] `it calls register with an empty methods object`
- [x] `it does not render any DOM elements`
- [x] `it catches and logs errors from register without throwing`

## Acceptance Criteria

- All requirements have passing tests
- No `useState`, `useEffect`, or `GuestConnectionContext` imports
- Extension ID matches `extension-manifest.json` id field (`delivery-fee-rules`)
- `register()` called with `{ id, methods: {} }` matching the sample
