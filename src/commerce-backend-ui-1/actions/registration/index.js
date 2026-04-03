const HTTP_OK = 200;

/**
 * Returns the Admin UI SDK menu registration payload for this application.
 *
 * Auth is enforced by the App Builder runtime (require-adobe-auth: true).
 * This action does not perform any I/O.
 *
 * @returns {{ statusCode: number, body: object }}
 */
function main(_params) {
  return {
    statusCode: HTTP_OK,
    body: {
      pages: [
        {
          id: "delivery-fee-rules",
          label: "Delivery Fees",
          parent: "Stores",
          icon: "Airplane",
        },
      ],
    },
  };
}

exports.main = main;
