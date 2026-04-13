import config from "../config.json" with { type: "json" };

const ADMIN_UI_SDK_REGISTRATION_SUFFIX = "admin-ui-sdk/registration";
const DELIVERY_FEE_PACKAGE = "delivery-fee";
const ACTION_RULES_LIST = "rules-list";
const ACTION_RULES_CREATE = "rules-create";
const ACTION_RULES_DELETE = "rules-delete";

/**
 * Derives the base URL for the delivery-fee package from the registration URL
 * in config.json. The registration URL has the form:
 *   https://{org}-{workspace}.adobeio-static.net/api/v1/web/admin-ui-sdk/registration
 * We replace "admin-ui-sdk/registration" with "delivery-fee/{action}".
 */
function resolveActionUrl(actionName) {
  const registrationUrl = config.registration;
  if (!registrationUrl) {
    throw new Error(
      "Cannot resolve delivery-fee action URL: registration URL is missing from config.json",
    );
  }
  return registrationUrl.replace(
    ADMIN_UI_SDK_REGISTRATION_SUFFIX,
    `${DELIVERY_FEE_PACKAGE}/${actionName}`,
  );
}

function buildAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Lists all delivery-fee rules.
 */
export async function listRules(token) {
  const url = resolveActionUrl(ACTION_RULES_LIST);
  const response = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });
  const data = await handleResponse(response);
  return data.rules;
}

/**
 * Creates a new delivery-fee rule (upsert by country+region).
 */
export async function createRule(token, rule) {
  const url = resolveActionUrl(ACTION_RULES_CREATE);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rule),
  });
  const data = await handleResponse(response);
  return data.rule;
}

/**
 * Updates an existing delivery-fee rule. Calls the same upsert endpoint as createRule.
 */
export async function updateRule(token, rule) {
  return await createRule(token, rule);
}

/**
 * Deletes a delivery-fee rule by country and region.
 */
export async function deleteRule(token, country, region) {
  const url = resolveActionUrl(ACTION_RULES_DELETE);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ country, region }),
  });
  await handleResponse(response);
}
