# Task 001: Configuration Files

**Status**: completed
**Depends on**: none
**Retry count**: 0

## Description

Add the `delivery-fee` action package to the project configuration. This creates the `app.config.yaml` entry and a new `actions/delivery-fee/actions.config.yaml` defining all five runtime actions with correct web/auth settings.

## Context

- Related files: `app.config.yaml` (add `$include` entry), new `actions/delivery-fee/actions.config.yaml`
- Patterns to follow: existing packages in `app.config.yaml` (e.g., `order-commerce`); existing `actions.config.yaml` files such as `actions/order/commerce/actions.config.yaml`
- `calculate` action must be `web: 'yes'` with `require-adobe-auth: false` (public endpoint called by EDS storefront)
- Rule management actions (`rules-create`, `rules-get`, `rules-delete`, `rules-list`) must be `web: 'yes'` with `require-adobe-auth: true`
- All actions use `runtime: nodejs:22` and `LOG_LEVEL: debug`

## Requirements (Test Descriptions)

- [x] `it includes delivery-fee package in app.config.yaml`
- [x] `it defines calculate action as a public web action with no adobe auth`
- [x] `it defines rules-create action as a web action requiring adobe auth`
- [x] `it defines rules-get action as a web action requiring adobe auth`
- [x] `it defines rules-delete action as a web action requiring adobe auth`
- [x] `it defines rules-list action as a web action requiring adobe auth`
- [x] `it sets runtime to nodejs:22 for all actions`

## Acceptance Criteria

- All requirements have passing tests
- `app.config.yaml` is valid YAML and parseable
- `actions/delivery-fee/actions.config.yaml` is valid YAML
- No existing actions are affected

## Implementation Notes

- Created `actions/delivery-fee/actions.config.yaml` with five actions: `calculate` (web, no adobe auth) and `rules-create`, `rules-get`, `rules-delete`, `rules-list` (web, require adobe auth). All use `runtime: nodejs:22` and `LOG_LEVEL: debug`.
- Added `delivery-fee` package entry to `app.config.yaml` with `$include: ./actions/delivery-fee/actions.config.yaml`.
- Tests parse the YAML files using `js-yaml` and assert on the parsed structure.
- Action function paths follow the pattern `actions/delivery-fee/{action-name}/index.js`.
