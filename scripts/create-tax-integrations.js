const fs = require("node:fs");
const path = require("node:path");

const fetch = require("node-fetch");
const yaml = require("js-yaml");

const { getAdobeAccessHeaders } = require("../utils/adobe-auth");

require("dotenv").config();

const TAX_INTEGRATION_API_PATH = "V1/oope_tax_management/tax_integration";
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_CLIENT_ERROR_MAX = 500;

/**
 * Reads the tax-integrations.yaml from the project root
 * @returns {Array} Array of tax integration configuration objects
 */
function readTaxIntegrations() {
  const yamlPath = path.resolve(__dirname, "../tax-integrations.yaml");
  const content = fs.readFileSync(yamlPath, "utf8");
  return yaml.load(content);
}

/**
 * POSTs a single tax integration to the Commerce REST API
 * @param {string} baseUrl - Commerce base URL (must end with /)
 * @param {object} authHeaders - Authorization headers with Bearer token
 * @param {object} integration - Tax integration configuration object
 * @returns {Promise<void>}
 */
async function postTaxIntegration(baseUrl, authHeaders, integration) {
  const { code } = integration;
  const url = `${baseUrl}${TAX_INTEGRATION_API_PATH}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ tax_integration: integration }),
  });

  if (!response.ok) {
    const body = await response.json();
    const message = body?.message ?? "Unknown error";
    const errorMsg = `Failed to create tax integration "${code}" (HTTP ${response.status}): ${message}`;

    if (
      response.status >= HTTP_CLIENT_ERROR_MIN &&
      response.status < HTTP_CLIENT_ERROR_MAX
    ) {
      console.error(
        `[create-tax-integrations] 4xx error for integration "${code}": ${errorMsg}`,
      );
    } else {
      console.error(
        `[create-tax-integrations] Server error for integration "${code}": ${errorMsg}`,
      );
    }

    throw new Error(errorMsg);
  }

  console.log(
    `[create-tax-integrations] Successfully created tax integration: ${code}`,
  );
}

/**
 * Main entry point — reads tax-integrations.yaml and registers each entry in Commerce
 * @returns {Promise<void>}
 */
async function main() {
  const integrations = readTaxIntegrations();
  const authHeaders = await getAdobeAccessHeaders(process.env);
  const baseUrl = process.env.COMMERCE_BASE_URL;

  for (const integration of integrations) {
    await postTaxIntegration(baseUrl, authHeaders, integration);
  }

  const codes = integrations.map((i) => i.code).join(", ");
  console.log(
    `[create-tax-integrations] All tax integrations registered successfully: ${codes}`,
  );
}

exports.main = main;
