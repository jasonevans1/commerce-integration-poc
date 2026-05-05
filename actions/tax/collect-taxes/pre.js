const DEFAULT_TAX_RATE = 0;

function preProcess(params) {
  let oopQuote;

  if (params.__ow_body) {
    const decoded = Buffer.from(params.__ow_body, "base64").toString("utf8");
    oopQuote = JSON.parse(decoded).oopQuote;
  } else {
    oopQuote = params.oopQuote;
  }

  const { items } = oopQuote;
  const taxRatePercent =
    params.TAX_RATE_PERCENT !== undefined
      ? Number(params.TAX_RATE_PERCENT)
      : DEFAULT_TAX_RATE;

  const shipTo = oopQuote.ship_to_address;
  const country = shipTo?.country ? String(shipTo.country).toUpperCase() : null;
  const region = shipTo?.region_code
    ? String(shipTo.region_code).toUpperCase()
    : "";

  return { items, taxRatePercent, country, region };
}

module.exports = {
  preProcess,
};
