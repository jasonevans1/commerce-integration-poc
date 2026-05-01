const PERCENTAGE_DIVISOR = 100;
const ROUNDING_FACTOR = 100;
const TAX_CODE = "flat-rate-tax";
const TAX_TITLE = "Flat Rate Tax";
const TAX_BREAKDOWN_INSTANCE =
  "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface";
const TAX_INSTANCE =
  "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxInterface";

/**
 * Applies flat-rate tax to taxable line items and returns JSON Patch operations
 * in the format expected by the Commerce OOP tax module.
 *
 * @param {{ items: Array, taxRatePercent: number }} normalized
 * @returns {Array} Array of JSON Patch operations
 */
function transformData(normalized) {
  const { items, taxRatePercent } = normalized;
  const rate = Number(taxRatePercent);
  const operations = [];

  items.forEach((item, index) => {
    const rowTotal = item.unit_price * item.quantity;
    const taxAmount =
      Math.round(((rowTotal * rate) / PERCENTAGE_DIVISOR) * ROUNDING_FACTOR) /
      ROUNDING_FACTOR;

    operations.push({
      op: "add",
      path: `oopQuote/items/${index}/tax_breakdown`,
      value: {
        data: {
          code: TAX_CODE,
          rate,
          amount: taxAmount,
          title: TAX_TITLE,
          tax_rate_key: `${TAX_CODE}-${rate}`,
        },
      },
      instance: TAX_BREAKDOWN_INSTANCE,
    });

    operations.push({
      op: "replace",
      path: `oopQuote/items/${index}/tax`,
      value: {
        data: {
          rate,
          amount: taxAmount,
          discount_compensation_amount: 0,
        },
      },
      instance: TAX_INSTANCE,
    });
  });

  return operations;
}

module.exports = {
  transformData,
};
