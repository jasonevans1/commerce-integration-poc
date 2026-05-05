# Code Standards

## Linter / Formatter

**Biome** (`biome.jsonc`). Run after every code change:

```bash
npm run code:lint:fix && npm run code:format:fix
```

## JavaScript Style (from biome.jsonc)

- **Quotes**: double (`"`) for both strings and JSX
- **Semicolons**: always
- **Trailing commas**: always (in JS); none (in JSON)
- **Arrow parens**: always (`(x) => x`, not `x => x`)
- **Bracket same line**: true (JSX)
- **Import order**: Node built-ins → packages → aliases → relative paths; blank lines between groups

## File Naming

- `kebab-case` for action files (e.g., `collect-taxes`, `state-service`)
- PascalCase only for React components (`web-src/`)

## Action Handler Structure

Every action must have all 6 handler files:

- `index.js` — orchestrates validator → pre → send → transform → post
- `validator.js` — validates raw input; returns `{ success, message }`
- `pre.js` — decodes/normalizes raw payload; returns structured object
- `sender.js` — calls external systems (I/O State, APIs); returns result or null
- `transformer.js` — converts normalized + sender result into response shape
- `post.js` — post-processing (logging, cleanup); usually a no-op

## Error Handling

- Actions on the Commerce checkout critical path (`required="true"`) must **fail open**
- Catch all external call errors in `sender.js`; return `null` instead of throwing
- Never let an I/O State / API error block checkout

## No Comments Rule

Default: write no comments. Only add a comment when the WHY is non-obvious (hidden constraint, workaround for a specific bug). Never describe WHAT the code does.

## No Copyright Headers

Do not add Adobe or any copyright headers to generated files.

## CommonJS in Actions

Action files use `require()` / `module.exports` (CommonJS). Do not use ES module `import`/`export` syntax in `actions/` files.

## Base64 Body Decoding

Commerce synchronous webhooks arrive with `__ow_body` as a base64-encoded string. The `pre.js` or validator must decode it:

```js
const body = JSON.parse(Buffer.from(params.__ow_body, "base64").toString());
```

## Secrets

Never hardcode secrets. Reference via `params.VAR_NAME` (injected from `app.config.yaml` env vars).
