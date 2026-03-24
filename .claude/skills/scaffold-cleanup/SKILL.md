---
name: scaffold-cleanup
description: Performs pre-deployment scaffolding cleanup for Adobe Commerce App Builder extensions. Use before deploying to production to remove unused starter kit entities, clean configuration files, and reduce package size. Triggers on "deploy", "next steps", "go to production", or "Phase 5".
---

# Scaffold Cleanup & Deployment Readiness

## Role

You are a deployment readiness specialist. Before any deployment, analyze the project for unused starter kit scaffolding and present a cleanup report. This is a **blocking gate** — deployment cannot proceed until cleanup is addressed (approved or explicitly declined).

## When This Skill Activates (Automatic Triggers)

Trigger this skill when the user says:

- "deploy" / "aio app deploy"
- "next steps" after implementation
- "what's next" after code generation
- "help with deployment"
- "go to production"
- "Phase 5"

**Do NOT skip this gate.** Always present the cleanup report before executing any deployment.

---

## Step 1: Comprehensive Scaffolding Analysis

Read and analyze the following to understand what's used vs. unused:

**Requirements scan:**

- Read `REQUIREMENTS.md` → identify which entities/touchpoints were implemented

**Implementation scan:**

- `ls actions/*/` → list all entity directories
- Check which have actual handler implementations vs. starter kit stubs

**Configuration files to analyze:**

- `scripts/commerce-event-subscribe/config/commerce-event-subscribe.json`
- `scripts/onboarding/config/events.json`
- `scripts/onboarding/config/providers.json`
- `scripts/onboarding/config/starter-kit-registrations.json`
- `app.config.yaml`

**Environment scan:**

- `.env` → identify entity-specific variables that won't be needed

**Test scan:**

- `ls test/actions/*/` → identify test directories for unused entities

---

## Step 2: Present Cleanup Report

Present this report BEFORE asking for confirmation:

```
📋 **Complete Scaffolding Cleanup Analysis**

Based on REQUIREMENTS.md, I've identified:

✅ **Used Entities & Touchpoints (Keep)**
├── [Entity] (X touchpoints, Y files)
│   ├── /actions/[entity]/commerce/[event]/
│   └── /actions/[entity]/commerce/[event]/
└── [Repeat for each used entity]

❌ **Unused Starter Kit Scaffolding (Remove)**

**[Entity] - Complete Removal:**
├── Directory: /actions/[entity]/ (XX+ files)
├── Touchpoints removed: X (commerce: X, backoffice: X)
├── Config files: 2 (commerce/actions.config.yaml, external/actions.config.yaml)
├── Consumer actions: 2 (commerce/consumer, external/consumer)
├── Test files: ~XX files in /test/actions/[entity]/
└── Documentation: ~X README files

[Repeat for each unused entity]

**Configuration Cleanup:**
├── commerce-event-subscribe.json: X event subscriptions removed
├── events.json: Remove "[entity1]" and "[entity2]" sections (X event definitions)
├── providers.json: [Keep/Remove] "[provider]" provider
└── starter-kit-registrations.json: Remove X entity mappings

**app.config.yaml Package Cleanup:**
Remove X package declarations:
├── [entity]-commerce (package + $include)
└── [entity]-backoffice (package + $include)

**Environment Variables Cleanup (.env):**
Remove X variables:
├── [Provider ID variables for removed entities]
├── [External system credentials for removed entities]
└── [Entity-specific configuration variables]

**Dependencies to Review (package.json):**
Potentially unused:
└── [Entity-specific libraries — suggest but do not auto-remove]

**Impact Summary:**
- Remove: ~XXX files (X entities, Y touchpoints)
- Clean: X configuration files
- Clean: X app.config.yaml packages
- Clean: X environment variables
- Reduce: Package size by ~XX%
- Improve: Deployment time by ~XX%
- Security: Remove X unused credential sets

**Backups Will Be Created:**
✅ .env → .env.backup
✅ app.config.yaml → app.config.yaml.backup
✅ events.json → events.json.backup
✅ providers.json → providers.json.backup
✅ starter-kit-registrations.json → starter-kit-registrations.json.backup
```

Should I proceed with this comprehensive cleanup?

---

## Step 3: User Confirmation

Accept one of:

- **yes** — proceed with full cleanup
- **no** / **skip** — mark as declined and proceed to deployment
- **partial** — ask which entities to keep/remove
- **review [entity]** — show details for that entity before deciding

---

## Step 4: Execute Cleanup (In Order)

### 4.1 Create Backups First

```bash
cp .env .env.backup
cp app.config.yaml app.config.yaml.backup
cp scripts/onboarding/config/events.json scripts/onboarding/config/events.json.backup
cp scripts/onboarding/config/providers.json scripts/onboarding/config/providers.json.backup
cp scripts/onboarding/config/starter-kit-registrations.json scripts/onboarding/config/starter-kit-registrations.json.backup
```

### 4.2 Remove Unused Entity Directories

Remove entire entity directories from `actions/` and `test/actions/` for each unused entity.

### 4.3 Update Configuration Files

**commerce-event-subscribe.json** — remove event subscriptions for removed entities.

**events.json** — remove entity sections for removed entities.

**providers.json** — remove provider entries if all associated entities are removed.

**starter-kit-registrations.json** — remove entity-to-provider mappings for removed entities.

### 4.4 Update app.config.yaml

Remove package blocks for removed entities. Each entity typically has two packages:

- `[entity]-commerce` (Commerce → External direction)
- `[entity]-backoffice` (External → Commerce direction)

### 4.5 Clean Environment Variables (.env)

Remove variables for removed entities. **Never remove** these core variables:

```bash
# NEVER REMOVE - Core I/O identifiers
IO_ORG_ID, IO_CONSUMER_ID, IO_PROJECT_ID, IO_WORKSPACE_ID

# NEVER REMOVE - OAuth S2S credentials
OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_SCOPES
OAUTH_TECHNICAL_ACCOUNT_ID, OAUTH_TECHNICAL_ACCOUNT_EMAIL

# NEVER REMOVE - I/O Events credentials
ADOBE_IO_EVENTS_CLIENT_ID, ADOBE_IO_EVENTS_CLIENT_SECRET

# NEVER REMOVE - Commerce connection
COMMERCE_BASE_URL, COMMERCE_CONSUMER_KEY, COMMERCE_CONSUMER_SECRET
COMMERCE_ACCESS_TOKEN, COMMERCE_ACCESS_TOKEN_SECRET

# NEVER REMOVE - Event configuration
COMMERCE_ADOBE_IO_EVENTS_MERCHANT_ID, EVENT_PREFIX

# KEEP - Active provider IDs for implemented entities
[ENTITY]_COMMERCE_PROVIDER_ID  (only for entities you kept)
```

### 4.6 Review Dependencies (Suggest, Don't Auto-Remove)

List potentially unused packages from `package.json` and ask user before removing:

```bash
# Example: if no product entity, these may be unused
# got (if only used by product sender)
# graphql-request (if only used by product queries)
```

Always run `npm install` after any `package.json` changes.

### 4.7 Update Documentation

- Update `env.dist` / `.env.example` to remove variables for removed entities
- Update `README.md` to reflect only implemented entities (if applicable)

---

## Step 5: Verification

```bash
# Validate all JSON config files
jq . scripts/onboarding/config/events.json > /dev/null && echo "events.json OK"
jq . scripts/onboarding/config/providers.json > /dev/null && echo "providers.json OK"
jq . scripts/onboarding/config/starter-kit-registrations.json > /dev/null && echo "registrations.json OK"
jq . scripts/commerce-event-subscribe/config/commerce-event-subscribe.json > /dev/null && echo "event-subscribe.json OK"

# Validate YAML
node -e "require('js-yaml').load(require('fs').readFileSync('app.config.yaml','utf8'))" && echo "app.config.yaml OK"

# Check for orphaned references to removed entities
grep -r "[removed-entity]" actions/ app.config.yaml 2>/dev/null && echo "WARNING: orphaned references found"

# Run lint check
npm run code:report
```

---

## Step 6: Present Cleanup Summary

```
✅ Scaffolding Cleanup Complete

**Files Removed:** [count] files across [X] entity directories
**Config Files Cleaned:** events.json, providers.json, starter-kit-registrations.json, commerce-event-subscribe.json
**app.config.yaml:** Removed [X] package declarations
**Environment Variables:** Removed [X] unused variables
**Backups Created:** .env.backup, app.config.yaml.backup, events.json.backup, providers.json.backup, starter-kit-registrations.json.backup
**Verification:** All JSON and YAML files valid ✅

**Recommended next step:** Commit this cleanup before deploying.

git add -A
git commit -m "chore: remove unused starter kit scaffolding, keep [entity] entity only"
```

---

## Step 7: Mark Phase 5 Complete in REQUIREMENTS.md

Append to `REQUIREMENTS.md`:

```markdown
## Phase 5: Scaffolding Cleanup & Deployment Readiness ✅

- **Status:** Complete
- **Date:** [Date]
- **Action Taken:** [Full cleanup / Partial cleanup / Declined]
- **Files Removed:** [Count or "None - cleanup declined"]
- **Configuration Files Cleaned:** [List or "None"]
```

---

## Deployment Readiness Checklist

After cleanup, confirm before running `aio app deploy`:

```markdown
### 📋 Pre-Deployment Checklist

**Cleanup:**

- [ ] Unused entities removed
- [ ] Configuration files cleaned and validated
- [ ] Environment variables cleaned
- [ ] Backups created

**Code Quality:**

- [ ] `npm run code:report` passes
- [ ] All 6 handler files present for each implemented action
- [ ] No hardcoded credentials

**Security:**

- [ ] `.env` is gitignored
- [ ] All secrets use `$VAR` references in app.config.yaml
- [ ] `require-adobe-auth: true` and `final: true` annotations set

**Testing:**

- [ ] `npm test` passes (if tests exist)
- [ ] Local testing completed with `aio app dev`

**Documentation:**

- [ ] `env.dist` updated to reflect current variables
- [ ] REQUIREMENTS.md updated with Phase 5 marker
```

After all boxes are checked, proceed with:

```bash
aio app deploy
npm run onboard
npm run commerce-event-subscribe
```
