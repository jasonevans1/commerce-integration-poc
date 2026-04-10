---
name: 002-hello-world-panel
description: Create HelloWorldPanel React Spectrum component
type: project
---

# Task 002: Create HelloWorldPanel React Component

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/components/HelloWorldPanel.jsx` — a minimal React Spectrum component that renders a "Hello World" heading. This panel is loaded by the Commerce Admin in an iFrame when the Hello World mass action is triggered.

## Context

- **New file**: `src/commerce-backend-ui-1/web-src/src/components/HelloWorldPanel.jsx`
- **Patterns to follow**: use named imports from `@adobe/react-spectrum` and a default export function component (see existing components in `src/commerce-backend-ui-1/web-src/src/components/`)
- Use `@adobe/react-spectrum` components: `Heading`, `View`, `Flex`
- The React Spectrum `Provider` is already set up in `App.jsx` wrapping all routes — do NOT add a duplicate `Provider` inside this panel component
- The panel does not need to communicate back to the host for Hello World — no `@adobe/uix-guest` call required in the panel itself
- Keep the component stateless and dependency-free beyond React and React Spectrum
- No `@adobe/uix-guest` registration in this component (that lives in `ExtensionRegistration.jsx`)

## Requirements (Test Descriptions)

- [ ] `it renders a Heading with text "Hello World"`
- [ ] `it renders inside a React Spectrum View with padding`
- [ ] `it is exported as default`

## Acceptance Criteria

- File exists at the correct path
- Renders a visible "Hello World" heading using React Spectrum `Heading`
- Uses React Spectrum layout components (`View`, `Flex`) for basic centering/padding
- No prop types required (no external props needed for Hello World)
- Code passes lint and format checks

## Implementation Notes

(Left blank — filled in by programmer during implementation)
