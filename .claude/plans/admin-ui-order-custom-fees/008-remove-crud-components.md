# Task 008: Remove CRUD Components and Utilities

**Status**: complete
**Depends on**: 004, 005
**Retry count**: 0

## Description

Delete the CRUD management components (RuleList, RuleForm, DeleteConfirm), the API utility, and the GuestConnectionContext — none of which are used in the `order.customFees` pattern. The extension no longer surfaces a management page; rules are managed via the backend REST API directly.

## Context

- Files to DELETE:
  - `src/commerce-backend-ui-1/web-src/src/components/RuleList.jsx`
  - `src/commerce-backend-ui-1/web-src/src/components/RuleForm.jsx`
  - `src/commerce-backend-ui-1/web-src/src/components/DeleteConfirm.jsx`
  - `src/commerce-backend-ui-1/web-src/src/utils/api.js`
  - `src/commerce-backend-ui-1/web-src/src/utils/GuestConnectionContext.js`
  - `src/commerce-backend-ui-1/web-src/src/config.json` (only used by api.js for action URLs)
- After deletion, verify no remaining imports reference these files
- The `utils/` and `components/` directories may become partially or fully empty — remove empty dirs

## Requirements (Test Descriptions)

- [x] `RuleList.jsx does not exist`
- [x] `RuleForm.jsx does not exist`
- [x] `DeleteConfirm.jsx does not exist`
- [x] `utils/api.js does not exist`
- [x] `utils/GuestConnectionContext.js does not exist`
- [x] `App.jsx does not import RuleList`
- [x] `App.jsx does not import RuleForm`
- [x] `App.jsx does not import DeleteConfirm`

## Acceptance Criteria

- All requirements have passing tests
- No dangling imports in `App.jsx` or any remaining file
- No lint errors from missing imports
