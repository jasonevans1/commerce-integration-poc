# Testing Configuration

## Test Runner

Jest, configured at `test/jest.config.js`.

## Commands

**Full test suite (use for final validation):**

```bash
npm test
```

**Run tests for a specific file pattern:**

```bash
npm test -- --testPathPattern="collect-taxes" --passWithNoTests
```

**Run tests with bail on first failure (RED phase):**

```bash
npm test -- --testPathPattern="collect-taxes" --bail --passWithNoTests
```

**Run a single test by name:**

```bash
npm test -- --testPathPattern="collect-taxes" --testNamePattern="it returns" --passWithNoTests
```

## Test File Location

- Backend tests: `test/actions/**/*.test.js`
- Test match glob: `test/**/*.test.js`

## TDD Red-Green-Refactor Protocol

1. **RED**: Write the failing test first. Run with `--bail` to confirm it fails.
2. **GREEN**: Write minimal implementation to make the test pass.
3. **REFACTOR**: Clean up without breaking tests. Run full suite.

## Critical: Module Mock Pattern

`jest.resetModules()` is called in `afterEach` in the collect-taxes test suite. This means **top-level `jest.mock()` calls are reset between tests**.

**WRONG (will not work):**

```js
jest.mock("../../../actions/delivery-fee/lib/state-service", () => ({
  getRule: jest.fn(),
}));
```

**CORRECT — use `jest.doMock` with absolute path + manual re-require:**

```js
const STATE_SERVICE_PATH = path.resolve(
  __dirname,
  "../../../../actions/delivery-fee/lib/state-service",
);

function withRule(rule) {
  jest.resetModules();
  jest.doMock(STATE_SERVICE_PATH, () => ({
    getRule: jest.fn().mockResolvedValue(rule),
  }));
  return require(path.join(ACTION_DIR, "index.js"));
}
```

## Coverage Thresholds

| Metric     | Threshold |
| ---------- | --------- |
| Branches   | 65%       |
| Functions  | 50%       |
| Lines      | 80%       |
| Statements | 80%       |

Coverage is collected from `actions/**/*.js`, `onboarding/**/*.js`, `utils/**/*.js`.

## Lint / Format (run after implementation)

```bash
npm run code:lint:fix && npm run code:format:fix
```

## Test Setup

- `test/jest.setup.js`: sets `process.env.CI = true`, `jest.setTimeout(30000)`
- Test environment: `node` for backend tests, `jsdom` for frontend tests
