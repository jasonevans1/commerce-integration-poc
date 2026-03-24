/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { isOperationSuccessful } = require("../../../telemetry");
const {
  instrument,
  getInstrumentationHelpers,
} = require("@adobe/aio-lib-telemetry");

/**
 * This function send the customer created dara to the external back-office application
 *
 * @param {object} params - include the env params
 * @param {object} data - Customer data
 * @param {object} preProcessed - result of the pre-process logic if any
 * @returns the sending result if needed for post process
 */
async function sendData(params, data, preProcessed) {
  const { currentSpan, logger } = getInstrumentationHelpers();
  currentSpan.addEvent("created.phase", { value: "sendData" });

  logger.info(
    `Sending customer created notification for ${data.fullName} (${data.email})`,
  );
  logger.debug(`Transformed payload: ${JSON.stringify(data)}`);

  if (!(params.RESEND_API_KEY && params.NOTIFICATION_EMAIL_TO)) {
    logger.info(
      "Email notifications not configured (missing RESEND_API_KEY or NOTIFICATION_EMAIL_TO), skipping email send",
    );
    return { success: true };
  }

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
        subject: `New Customer Created: ${data.fullName}`,
        html: `<h2>New Customer Created</h2>
<p><strong>Customer ID:</strong> ${data.customerId}</p>
<p><strong>Name:</strong> ${data.fullName}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Created At:</strong> ${data.timestamp}</p>`,
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
