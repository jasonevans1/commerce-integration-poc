const buildAuthHeaders = (imsToken) => ({
  Authorization: `Bearer ${imsToken}`,
  "Content-Type": "application/json",
});

const checkResponse = (response) => {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
};

const listRules = async (imsToken) => {
  const url = process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_LIST;
  const response = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(imsToken),
  });
  await checkResponse(response);
  return await response.json();
};

const createRule = async (imsToken, rule) => {
  const url = process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_CREATE;
  const response = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(imsToken),
    body: JSON.stringify(rule),
  });
  await checkResponse(response);
  return await response.json();
};

const getRule = async (imsToken, country, region) => {
  const base = process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_GET;
  const url = `${base}?country=${country}&region=${region}`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildAuthHeaders(imsToken),
  });
  await checkResponse(response);
  return await response.json();
};

const deleteRule = async (imsToken, country, region) => {
  const base = process.env.REACT_APP_ACTION_DELIVERY_FEE_RULES_DELETE;
  const url = `${base}?country=${country}&region=${region}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: buildAuthHeaders(imsToken),
  });
  await checkResponse(response);
};

module.exports = { listRules, createRule, getRule, deleteRule };
