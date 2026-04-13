const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const COVERAGE_BRANCHES = 65;
const COVERAGE_FUNCTIONS = 50;
const COVERAGE_LINES = 80;
const COVERAGE_STATEMENTS = 80;

module.exports = {
  collectCoverage: true,
  verbose: false,
  silent: true,
  coverageDirectory: path.join(__dirname, "test-coverage"),
  coverageReporters: ["text-summary", "html"],
  reporters: ["default"],
  projects: [
    {
      displayName: "backend",
      rootDir: ROOT,
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/**/*.test.js"],
      testPathIgnorePatterns: ["/node_modules/", "<rootDir>/test/web-src/"],
      collectCoverageFrom: [
        "<rootDir>/actions/**/*.js",
        "<rootDir>/onboarding/**/*.js",
        "<rootDir>/utils/**/*.js",
      ],
      coverageThreshold: {
        global: {
          branches: COVERAGE_BRANCHES,
          functions: COVERAGE_FUNCTIONS,
          lines: COVERAGE_LINES,
          statements: COVERAGE_STATEMENTS,
        },
      },
      setupFilesAfterEnv: ["<rootDir>/test/jest.setup.js"],
    },
    {
      displayName: "frontend",
      rootDir: ROOT,
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/test/web-src/**/*.test.{js,jsx}"],
      moduleNameMapper: {
        "^@adobe/react-spectrum$":
          "<rootDir>/test/__mocks__/@adobe/react-spectrum.js",
        "^@adobe/uix-guest$": "<rootDir>/test/__mocks__/@adobe/uix-guest.js",
        "^@adobe/exc-app$": "<rootDir>/test/__mocks__/@adobe/exc-app.js",
        "^core-js/stable$": "<rootDir>/test/__mocks__/empty.js",
        "^regenerator-runtime/runtime$": "<rootDir>/test/__mocks__/empty.js",
      },
      transform: {
        "^.+\\.[jt]sx?$": [
          "babel-jest",
          {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
          },
        ],
      },
      collectCoverageFrom: [
        "<rootDir>/src/commerce-backend-ui-1/web-src/src/**/*.{js,jsx}",
      ],
      setupFiles: ["<rootDir>/test/jest.setup.frontend.js"],
      setupFilesAfterEnv: [
        "<rootDir>/test/jest.setup.js",
        "@testing-library/jest-dom",
      ],
    },
  ],
};
