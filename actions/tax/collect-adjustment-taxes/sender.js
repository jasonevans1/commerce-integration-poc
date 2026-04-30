/**
 * No-op sender for the collect-adjustment-taxes webhook action.
 * Flat-rate adjustment tax requires no external service call.
 *
 * @param {object} _normalized - Normalized webhook parameters (unused)
 * @returns {Promise<null>} Always resolves to null
 */
async function sendData(_normalized) {
  return await Promise.resolve(null);
}

module.exports = {
  sendData,
};
