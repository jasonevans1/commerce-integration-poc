const PERCENTAGE_DIVISOR = 100;
const ROUNDING_FACTOR = 100;
const TAX_CODE = "flat-rate-tax";
const TAX_TITLE = "Flat Rate Tax";
const FEE_CODE = "delivery-fee";
const TAX_BREAKDOWN_INSTANCE =
  "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxBreakdownInterface";
const TAX_INSTANCE =
  "Magento\\OutOfProcessTaxManagement\\Api\\Data\\OopQuoteItemTaxInterface";

function round2(n) {
  return Math.round(n * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

function distributeFee(items, totalFee) {
  const lineSubtotals = items.map((item) =>
    round2(item.unit_price * item.quantity),
  );
  const totalSubtotal = lineSubtotals.reduce((sum, s) => sum + s, 0);

  if (totalSubtotal === 0) {
    return items.map((_, i) => (i === 0 ? totalFee : 0));
  }

  const portions = lineSubtotals.map((sub) =>
    round2((totalFee * sub) / totalSubtotal),
  );
  const portionSum = portions.reduce((sum, p) => sum + p, 0);
  portions[portions.length - 1] += round2(totalFee - portionSum);
  return portions;
}

function computeFeePortions(items, rule) {
  const lineSubtotals = items.map((item) =>
    round2(item.unit_price * item.quantity),
  );
  const totalSubtotal = lineSubtotals.reduce((sum, s) => sum + s, 0);
  const totalFee =
    rule.type === "percentage"
      ? round2((totalSubtotal * rule.value) / PERCENTAGE_DIVISOR)
      : round2(rule.value);
  if (totalFee > 0) {
    return distributeFee(items, totalFee);
  }
  return [];
}

function buildOpsWithFee(items, rate, rule) {
  const feePortions = computeFeePortions(items, rule);
  const operations = [];

  items.forEach((item, index) => {
    const rowTotal = item.unit_price * item.quantity;
    const taxAmount = round2((rowTotal * rate) / PERCENTAGE_DIVISOR);
    const feePortion = feePortions[index] ?? 0;
    const combinedAmount = round2(taxAmount + feePortion);

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
      op: "add",
      path: `oopQuote/items/${index}/tax_breakdown`,
      value: {
        data: {
          code: FEE_CODE,
          rate: 0,
          amount: feePortion,
          title: rule.name,
          tax_rate_key: FEE_CODE,
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
          amount: combinedAmount,
          discount_compensation_amount: 0,
        },
      },
      instance: TAX_INSTANCE,
    });
  });

  return operations;
}

function buildOpsNoFee(items, rate) {
  const operations = [];

  items.forEach((item, index) => {
    const rowTotal = item.unit_price * item.quantity;
    const taxAmount = round2((rowTotal * rate) / PERCENTAGE_DIVISOR);

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

function transformData(normalized, rule) {
  const { items, taxRatePercent } = normalized;
  const rate = Number(taxRatePercent);

  if (rule) {
    return buildOpsWithFee(items, rate, rule);
  }
  return buildOpsNoFee(items, rate);
}

module.exports = { transformData };
