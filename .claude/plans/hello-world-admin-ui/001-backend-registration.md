---
name: 001-backend-registration
description: Update registration action to include Hello World order mass action
type: project
---

# Task 001: Update Backend Registration for Hello World

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Update `src/commerce-backend-ui-1/actions/registration/index.js` to include an `order.massActions` entry for the Hello World feature alongside the existing `order.customFees`. The mass action definition points the Admin to the frontend panel URL when the user clicks the action in the Orders grid.

## Context

- **File to modify**: `src/commerce-backend-ui-1/actions/registration/index.js`
- **Existing test file**: `test/actions/commerce-backend-ui-1/registration.test.js` — add new test cases here for `massActions`; do NOT create a separate test file
- The current response shape returns `{ registration: { order: { customFees: [...] } } }`
- The Admin UI SDK merges all registered extension points from the response
- The `path` value must match the hash route that will be declared in `App.jsx` in task 003
- The `path` format for a hash-routed app is `index.html#/hello-world`
- Do NOT remove or alter the existing `order.customFees` logic
- `ExtensionRegistration.jsx` does NOT need changes — the backend registration `path` is sufficient for the Admin SDK to open the mass action panel in an iframe

## Requirements (Test Descriptions)

- [ ] `it includes order.massActions in the registration response`
- [ ] `it returns a massAction with id "hello-world", label "Hello World", and path "index.html#/hello-world"`
- [ ] `it still returns order.customFees alongside the new massActions`

## Acceptance Criteria

- Registration response contains both `order.customFees` and `order.massActions`
- `massActions` array has exactly one entry with `id: "hello-world"`, `label: "Hello World"`, `path: "index.html#/hello-world"`
- Existing delivery-fee rule mapping logic is unchanged
- Code passes lint and format checks

## Implementation Notes

(Left blank — filled in by programmer during implementation)
