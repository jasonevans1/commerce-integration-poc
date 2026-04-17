const HTTP_OK = 200;

const stateService = require("../../../../actions/delivery-fee/lib/state-service");

/**
 * Returns the Admin UI SDK order.customFees registration payload.
 * Dynamically reads all delivery fee rules from I/O State and maps them
 * to custom fee objects.
 *
 * Auth is enforced by the App Builder runtime (require-adobe-auth: true).
 *
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
async function main(_params) {
  let customFees = [];

  try {
    const rules = await stateService.listRules();
    customFees = rules.map((rule) => ({
      id: `delivery_fee_rules::${rule.country.toUpperCase()}_${rule.region.toUpperCase()}`,
      label: `Delivery Fee \u2014 ${rule.country}/${rule.region}`,
      value: rule.value,
    }));
  } catch (_error) {
    // intentionally empty — return empty customFees on error
  }

  return {
    statusCode: HTTP_OK,
    body: {
      registration: {
        menuItems: [
          {
            id: "delivery_fee_rules::custom_fees",
            title: "Custom Fees",
            parent: "delivery_fee_rules::store_extensions",
            sortOrder: 1,
          },
          {
            id: "delivery_fee_rules::store_extensions",
            title: "Store Extensions",
            isSection: true,
            sortOrder: 100,
          },
        ],
        order: {
          customFees,
          massActions: [
            {
              actionId: "hello-world",
              label: "Hello World",
              path: "index.html#/hello-world",
            },
          ],
        },
      },
    },
  };
}

exports.main = main;
