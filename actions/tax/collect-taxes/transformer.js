const PERCENTAGE_DIVISOR = 100;
const ROUNDING_FACTOR = 100;
const TAX_CODE = "flat-rate-tax";
const TAX_TITLE = "Flat Rate Tax";
const TAX_TYPE = "tax";

/**
 * Applies flat-rate tax to taxable line items.
 *
 * @param {{ items: Array, taxRatePercent: number }} normalized - Normalized webhook parameters
 * @returns {{ taxes: Array }} Computed tax line items
 */
function transformData(normalized) {
  const { items, taxRatePercent } = normalized;
  const rate = Number(taxRatePercent);

  const taxes = items.map((item) => {
    const amount =
      Math.round(
        ((item.row_total * rate) / PERCENTAGE_DIVISOR) * ROUNDING_FACTOR,
      ) / ROUNDING_FACTOR;

    return {
      code: TAX_CODE,
      amount,
      type: TAX_TYPE,
      title: TAX_TITLE,
      rate,
      item_id: item.item_id,
    };
  });

  return { taxes };
}

module.exports = {
  transformData,
};
