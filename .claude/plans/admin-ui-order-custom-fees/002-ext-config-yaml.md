# Task 002: Fix ext.config.yaml Web Field

**Status**: complete
**Depends on**: none
**Retry count**: 0

## Description

Update `src/commerce-backend-ui-1/ext.config.yaml` to match the sample's structure. The `web` field currently uses a nested `src:` key which is not the standard format. Fix it to the flat `web: web-src` form used by the sample.

## Context

- File to modify: `src/commerce-backend-ui-1/ext.config.yaml`
- Current (incorrect):
  ```yaml
  web:
    src: web-src/
  ```
- Target (from sample):
  ```yaml
  actions: actions
  web: web-src
  ```
- Also add the `actions: actions` field which explicitly declares the actions directory
- All other fields (`operations`, `runtimeManifest`) remain unchanged

## Requirements (Test Descriptions)

- [x] `ext.config.yaml web field is the string "web-src" not a nested object`
- [x] `ext.config.yaml declares actions field pointing to actions directory`
- [x] `ext.config.yaml operations view impl is index.html`
- [x] `ext.config.yaml runtimeManifest package is admin-ui-sdk with registration action`

## Acceptance Criteria

- All requirements have passing tests
- `ext.config.yaml` is valid YAML that parses without error
- `web` is a flat string value `web-src`
- `actions: actions` is present
