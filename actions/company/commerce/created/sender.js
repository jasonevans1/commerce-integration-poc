const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

const { isOperationSuccessful } = require("../../../telemetry");

const TRAILING_SLASH_REGEX = /\/+$/;

/**
 * Send the company created notification email via Resend
 *
 * @param {object} params - includes the env params
 * @param {object} data - Transformed company data
 * @param {object} preProcessed - result of the pre-process logic if any
 * @returns the sending result
 */
async function sendData(params, data, preProcessed) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "sendData" });

  logger.info(
    `Sending company created notification for company ${data.companyName} (ID: ${data.companyId})`,
  );
  logger.debug(`Transformed payload: ${JSON.stringify(data)}`);

  if (!(params.RESEND_API_KEY && params.NOTIFICATION_EMAIL_TO)) {
    logger.info(
      "Email notifications not configured (missing RESEND_API_KEY or NOTIFICATION_EMAIL_TO), skipping email send",
    );
    return { success: true };
  }

  const adminName = params.ADMIN_NAME || "Admin";
  const baseUrl = (params.COMMERCE_BASE_URL || "").replace(
    TRAILING_SLASH_REGEX,
    "",
  );
  const companyAdminUrl = `${baseUrl}/admin/company/index/edit/id/${data.companyId}`;

  try {
    const got = require("got");
    const response = await got.post("https://api.resend.com/emails", {
      headers: {
        Authorization: `Bearer ${params.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      json: {
        from: params.NOTIFICATION_EMAIL_FROM || "onboarding@resend.dev",
        to: [params.NOTIFICATION_EMAIL_TO],
        subject: `New Company Registration: ${data.companyName}`,
        html: `<p class="greeting company-greeting"><strong>Dear ${adminName},</strong></p>
<p>
    A company registration request has been submitted by customer ${data.customerName}. The account is temporarily locked until you approve or reject this company.
</p>
<p>
    <a href="${companyAdminUrl}">${data.companyName}</a>
</p>`,
      },
      responseType: "json",
    });

    logger.info(`Email notification sent successfully: ${response.body.id}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send email notification: ${error.message}`);
    return {
      success: false,
      statusCode: 500,
      message: `Email notification failed: ${error.message}`,
    };
  }
}

module.exports = {
  sendData: instrument(sendData, {
    isSuccessful: isOperationSuccessful,
  }),
};
