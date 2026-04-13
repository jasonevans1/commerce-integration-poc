# Task 003: Update web-src Dependencies

**Status**: complete
**Depends on**: none
**Retry count**: 0

## Description

Update `src/commerce-backend-ui-1/web-src/package.json` to match the sample's dependency set. Add `@adobe/exc-app` for Experience Cloud Shell integration, keep `@adobe/uix-guest` at `1.0.3` (do not change this version), add `@adobe/uix-core`, and add polyfill packages required by the ECS bootstrap pattern (`core-js`, `regenerator-runtime`). Also add `react-error-boundary`.

## Context

- File to modify: `src/commerce-backend-ui-1/web-src/package.json`
- Sample dependencies to add/update:
  ```json
  "@adobe/exc-app": "^1.1.3",
  "@adobe/uix-core": "^0.8.3",
  "@adobe/uix-guest": "1.0.3",
  "core-js": "^3.27.2",
  "react-error-boundary": "^3.1.4",
  "regenerator-runtime": "^0.13.11"
  ```
- Note: `@adobe/uix-guest` stays at `1.0.3` — do NOT change this version
- Keep existing deps: `@adobe/react-spectrum`, `react`, `react-dom`, `react-router-dom`
- Do NOT run `npm install` in this task — the build system handles it during `aio app deploy`

## Requirements (Test Descriptions)

- [x] `web-src/package.json lists @adobe/exc-app as a dependency`
- [x] `web-src/package.json lists @adobe/uix-guest as a dependency`
- [x] `web-src/package.json lists @adobe/uix-core as a dependency`
- [x] `web-src/package.json lists core-js as a dependency`
- [x] `web-src/package.json lists regenerator-runtime as a dependency`
- [x] `web-src/package.json lists react-error-boundary as a dependency`
- [x] `web-src/package.json lists @adobe/react-spectrum as a dependency`

## Acceptance Criteria

- All requirements have passing tests
- `package.json` is valid JSON
- All required packages present with appropriate version ranges

## Implementation Notes

- Added 5 new dependencies to `src/commerce-backend-ui-1/web-src/package.json`: `@adobe/exc-app`, `@adobe/uix-core`, `core-js`, `react-error-boundary`, `regenerator-runtime`
- Kept `@adobe/uix-guest` at exactly `"1.0.3"` (no change)
- Added 7 new test assertions to `test/config/admin-ui-phase2-scaffolding.test.js`
- All 14 tests pass
