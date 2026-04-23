const DELIVERY_FEE_CODE = "delivery_fee";
const TOTAL_SEGMENTS_PATH = "/totals/total_segments/-";
const GRAND_TOTAL_PATH = "/totals/grand_total";

/**
 * Assembles the JSON Patch array to inject (or replace) the delivery fee total segment.
 * Removes any previously accumulated delivery_fee segments before adding the new one,
 * ensuring the response is idempotent across multiple cart recalculations.
 *
 * @param {number} fee - Computed delivery fee amount (0 if no rule matches)
 * @param {string|null} name - Rule name used as segment title
 * @param {object} _normalized - Normalized webhook parameters (unused)
 * @param {object} params - Original webhook payload (for existing total_segments and grand_total)
 * @returns {Array} JSON Patch operations array
 */
function postProcess(fee, name, _normalized, params) {
  const segments = params.totals?.total_segments ?? [];

  const existingIndices = segments
    .map((seg, i) => (seg.code === DELIVERY_FEE_CODE ? i : -1))
    .filter((i) => i !== -1);

  const existingFeeTotal = existingIndices.reduce(
    (sum, i) => sum + segments[i].value,
    0,
  );

  const patch = [];

  // Remove existing delivery_fee segments in descending order so indices remain valid
  for (const i of [...existingIndices].sort((a, b) => b - a)) {
    patch.push({ op: "remove", path: `/totals/total_segments/${i}` });
  }

  if (fee > 0) {
    patch.push({
      op: "add",
      path: TOTAL_SEGMENTS_PATH,
      value: { code: DELIVERY_FEE_CODE, title: name, value: fee },
    });
  }

  if (existingIndices.length > 0 || fee > 0) {
    const existingGrandTotal = params.totals.grand_total;
    patch.push({
      op: "replace",
      path: GRAND_TOTAL_PATH,
      value: existingGrandTotal - existingFeeTotal + fee,
    });
  }

  return patch;
}

module.exports = {
  postProcess,
};
