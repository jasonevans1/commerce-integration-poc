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

function buildAuthHeaders(ims) {
  return {
    Authorization: `Bearer ${ims.token}`,
    "x-gw-ims-org-id": ims.org,
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
export async function listRules(ims) {
  const url = resolveActionUrl(ACTION_RULES_LIST);
  const response = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(ims),
  });
  const data = await handleResponse(response);
  return data.rules;
}

/**
 * Creates a new delivery-fee rule (upsert by country+region).
 */
export async function createRule(ims, rule) {
  const url = resolveActionUrl(ACTION_RULES_CREATE);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(ims),
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
export async function updateRule(ims, rule) {
  return await createRule(ims, rule);
}

/**
 * Deletes a delivery-fee rule by country and region.
 */
export async function deleteRule(ims, country, region) {
  const url = resolveActionUrl(ACTION_RULES_DELETE);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(ims),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ country, region }),
  });
  await handleResponse(response);
}
