/**
 * Returns an empty operations array for the adjustment tax use case.
 * For the flat-rate POC, credit memo tax adjustments are not recalculated
 * out-of-process — Commerce handles this internally.
 *
 * @param {object} _normalized - Normalized webhook parameters (unused)
 * @returns {Array} Empty operations array
 */
function transformData(_normalized) {
  return [];
}

module.exports = {
  transformData,
};
