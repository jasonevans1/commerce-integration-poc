# Task 007: RuleForm Component

**Status**: completed
**Depends on**: 003
**Retry count**: 0

## Description

Create `src/commerce-backend-ui-1/web-src/src/components/RuleForm.jsx` — a React Spectrum form used for both creating new delivery fee rules and editing existing ones. In create mode it renders a blank form; in edit mode it pre-populates by fetching the rule via `api.getRule`. On submit it calls `api.createRule` (the backend action is an upsert) and redirects to the rule list on success.

## Context

- Route params determine mode: `/rules/new` → create, `/rules/edit/:country/:region` → edit.
- Uses React Router `useParams` for edit mode and `useNavigate` for post-submit redirect.
- Rule fields: `country` (text, required), `region` (text, required), `name` (text, required), `type` (select: `fixed` | `percentage`, required), `value` (number, required, > 0).
- In edit mode, `country` and `region` fields should be read-only (they form the primary key).
- Reads the IMS token using the shared pattern defined in Task 003 (either `useSharedContext()` from `@adobe/uix-guest` or a React context from `utils/guestConnection.js`). Check the implementation from Task 003 for the exact pattern before implementing.
- Related files:
  - `src/commerce-backend-ui-1/web-src/src/utils/api.js` (Task 003)
  - `actions/delivery-fee/rules-create/validator.js` — reference for the rule schema

## Requirements (Test Descriptions)

- [ ] `it renders blank fields in create mode`
- [ ] `it fetches and pre-populates the rule fields in edit mode`
- [ ] `it makes country and region fields read-only in edit mode`
- [ ] `it shows a validation error when country is empty on submit`
- [ ] `it shows a validation error when region is empty on submit`
- [ ] `it shows a validation error when name is empty on submit`
- [ ] `it shows a validation error when value is not a positive number`
- [ ] `it shows a validation error when type is percentage and value exceeds 100`
- [ ] `it shows a validation error when type is not selected`
- [ ] `it calls createRule with the form data on valid submit`
- [ ] `it navigates to the rule list after successful submit`
- [ ] `it shows an error message when the API call fails`
- [ ] `it shows a loading indicator while fetching the rule in edit mode`

## Acceptance Criteria

- All requirements have passing tests (mock `api.js`, mock `@adobe/uix-guest`, mock React Router)
- Component is exported as default
- Client-side validation mirrors the server-side rules in `rules-create/validator.js`

## Implementation Notes

(Left blank - filled in by programmer during implementation)
