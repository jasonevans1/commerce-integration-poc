const PERCENTAGE_DIVISOR = 100;
const ROUNDING_FACTOR = 100;

/**
 * Computes the delivery fee from a rule and normalized subtotal.
 *
 * @param {{ subtotal: number }} normalized - Normalized webhook parameters including subtotal
 * @param {object|null} rule - Fee rule from state, or null if no rule matches
 * @returns {{ fee: number, name: string|null }} Computed fee and rule name
 */
function transformData(normalized, rule) {
  if (!rule) {
    return { fee: 0, name: null };
  }

  let fee;
  if (rule.type === "fixed") {
    fee = rule.value;
  } else {
    fee =
      Math.round(
        ((normalized.subtotal * rule.value) / PERCENTAGE_DIVISOR) *
          ROUNDING_FACTOR,
      ) / ROUNDING_FACTOR;
  }

  return { fee, name: rule.name };
}

module.exports = {
  transformData,
};
