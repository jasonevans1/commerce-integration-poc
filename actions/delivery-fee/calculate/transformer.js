const NO_FEE_NAME = "No delivery fee applies";
const PERCENTAGE_DIVISOR = 100;
const ROUNDING_FACTOR = 100;

/**
 * Computes the delivery fee from a rule and subtotal.
 *
 * @param {object} params - Normalized parameters including subtotal
 * @param {object|null} rule - Fee rule from state, or null if no rule matches
 * @returns {{ fee: number, name: string }} Computed fee and rule name
 */
function transformData(params, rule) {
  if (!rule) {
    return { fee: 0, name: NO_FEE_NAME };
  }

  let fee;
  if (rule.type === "fixed") {
    fee = rule.value;
  } else {
    fee =
      Math.round(
        ((params.subtotal * rule.value) / PERCENTAGE_DIVISOR) * ROUNDING_FACTOR,
      ) / ROUNDING_FACTOR;
  }

  return { fee, name: rule.name };
}

module.exports = {
  transformData,
};
