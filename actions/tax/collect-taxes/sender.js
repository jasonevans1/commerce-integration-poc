const { getRule } = require("../../delivery-fee/lib/state-service");

async function sendData(normalized) {
  const { country, region } = normalized;
  if (!country) {
    return null;
  }
  try {
    return await getRule(country, region);
  } catch (_error) {
    return null;
  }
}

module.exports = { sendData };
