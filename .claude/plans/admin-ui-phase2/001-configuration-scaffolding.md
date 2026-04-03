# Task 001: Configuration & Project Scaffolding

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Create all configuration files needed to register the `commerce/backend-ui/1` extension point with App Builder. This includes the extension entry config, the web-src sub-project package.json with React dependencies, the public HTML entry point, and the update to the root `app.config.yaml`.

## Context

- Platform is SaaS — Admin UI SDK is enabled in Commerce Admin; no PHP module needed.
- `ext.config.yaml` is the entry point for the extension, included from `app.config.yaml`.
- The registration action lives under `src/commerce-backend-ui-1/actions/registration/` (not `actions/`).
- `web-src/package.json` must declare React, React DOM, React Router, `@adobe/uix-guest`, and `@adobe/react-spectrum` as dependencies. App Builder handles installing `web-src` dependencies during `aio app build/deploy`. Testing dependencies (`jest-environment-jsdom`, `@testing-library/*`) should go in the ROOT `package.json` devDependencies since Jest runs from the project root.
- **IMPORTANT: `app.config.yaml` structure.** The existing file uses `application.runtimeManifest.packages` for backend actions. The Admin UI SDK extension must be added as a **top-level `extensions` block**, NOT under `application.runtimeManifest.packages`. The correct structure is:
  ```yaml
  extensions:
    commerce/backend-ui/1:
      $include: src/commerce-backend-ui-1/ext.config.yaml
  ```
  This `extensions` block is a sibling of the existing `application` block.
- **IMPORTANT: `ext.config.yaml` format.** The extension config uses a different structure than `actions.config.yaml`. It must have `operations`, `web` (pointing to `web-src`), and `runtimeManifest` keys. Example:
  ```yaml
  operations:
    view:
      - type: web
        impl: index.html
  web:
    src: web-src/
  runtimeManifest:
    packages:
      commerce-backend-ui-1:
        license: Apache-2.0
        actions:
          registration:
            function: actions/registration/index.js
            web: "yes"
            runtime: nodejs:22
            inputs:
              LOG_LEVEL: debug
            annotations:
              require-adobe-auth: true
              final: true
  ```
- **Biome linting:** After scaffolding, verify that JSX files under `src/` pass Biome lint. An override in `biome.jsonc` for `src/**/*.{js,jsx}` may be needed (e.g., to allow `noConsole` during development).
- Related files to read first:
  - `app.config.yaml` — existing structure; note the `application` block and add `extensions` as a sibling
  - `actions/delivery-fee/actions.config.yaml` — pattern for action config files
  - `biome.jsonc` — verify lint rules apply correctly to new JSX files

## Requirements (Test Descriptions)

- [ ] `ext.config.yaml declares the registration action with require-adobe-auth true and web yes`
- [ ] `ext.config.yaml includes the web-src directory as the UI source`
- [ ] `app.config.yaml includes the commerce/backend-ui/1 extension via ext.config.yaml`
- [ ] `web-src/package.json lists @adobe/uix-guest as a dependency`
- [ ] `web-src/package.json lists @adobe/react-spectrum packages as dependencies`
- [ ] `web-src/package.json lists react-router-dom as a dependency`
- [ ] `index.html has a root div with id root for React mounting`

## Acceptance Criteria

- All requirements have passing tests (config validation via schema checks or snapshot tests)
- `aio app build` can locate and parse `ext.config.yaml` without errors
- No decrease in existing test coverage

## Implementation Notes

(Left blank - filled in by programmer during implementation)
