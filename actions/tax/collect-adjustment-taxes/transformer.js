/**
 * Returns a zero-adjustment tax response for the flat-rate POC use case.
 * Tax adjustments (e.g., after order cancellation or partial refund) result
 * in no additional taxes — Commerce will handle credit memo tax calculations.
 *
 * @param {object} _normalized - Normalized webhook parameters (unused for flat rate)
 * @returns {{ taxes: Array }} Zero-adjustment tax response
 */
function transformData(_normalized) {
  return { taxes: [] };
}

module.exports = {
  transformData,
};
