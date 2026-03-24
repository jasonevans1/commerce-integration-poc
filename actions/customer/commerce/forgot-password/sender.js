const { isOperationSuccessful } = require("../../../telemetry");
const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * Sends the password reset email via Resend.
 *
 * @param {object} params - env params (RESEND_API_KEY, NOTIFICATION_EMAIL_FROM)
 * @param {object} data - Transformed customer data including resetUrl
 * @param {object} preProcessed - result of the pre-process logic if any
 * @returns {{ success: boolean, statusCode?: number, message?: string }}
 */
async function sendData(params, data, preProcessed) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("forgot-password.phase", { value: "sendData" });

  if (!(params.RESEND_API_KEY && params.NOTIFICATION_EMAIL_TO)) {
    logger.info(
      "RESEND_API_KEY or NOTIFICATION_EMAIL_TO not configured — skipping email send",
    );
    return { success: true };
  }

  const firstName = data.firstname || "there";
  const emailText = `Hi ${firstName},

We received a request to reset your password.

Click the link below to set a new password:
${data.resetUrl}

This link will expire shortly. If you did not request a password reset, you can ignore this email.`;

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
        subject: "Reset Your Password",
        text: emailText,
      },
      responseType: "json",
    });

    logger.info(
      `Password reset email sent to ${data.email} via Resend — id: ${response.body.id}`,
    );
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`);
    return {
      success: false,
      statusCode: 500,
      message: `Failed to send password reset email: ${error.message}`,
    };
  }
}

module.exports = {
  sendData: instrument(sendData, {
    isSuccessful: isOperationSuccessful,
  }),
};
