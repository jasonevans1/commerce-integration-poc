const DELIVERY_FEE_CODE = "delivery_fee";
const TOTAL_SEGMENTS_PATH = "/totals/total_segments/-";
const GRAND_TOTAL_PATH = "/totals/grand_total";

/**
 * Assembles the JSON Patch array to inject the delivery fee total segment.
 *
 * @param {number} fee - Computed delivery fee amount
 * @param {string|null} name - Rule name used as segment title
 * @param {object} _normalized - Normalized webhook parameters (unused)
 * @param {object} params - Original webhook payload (for existing grand_total)
 * @returns {Array} JSON Patch operations array, or empty array if fee is 0
 */
function postProcess(fee, name, _normalized, params) {
  if (fee === 0) {
    return [];
  }

  const existingGrandTotal = params.totals.grand_total;

  return [
    {
      op: "add",
      path: TOTAL_SEGMENTS_PATH,
      value: {
        code: DELIVERY_FEE_CODE,
        title: name,
        value: fee,
      },
    },
    {
      op: "replace",
      path: GRAND_TOTAL_PATH,
      value: existingGrandTotal + fee,
    },
  ];
}

module.exports = {
  postProcess,
};
