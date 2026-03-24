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

/**
 * This function send the customer deleted dara to the external back-office application
 *
 * @param {object} params - include the env params
 * @param {object} data - Customer data
 * @param {object} preProcessed - result of the pre-process logic if any
 * @returns the sending result if needed for post process
 * @throws {Error} - throws exception in case the process fail.
 */
async function sendData(params, data, preProcessed) {
  const { Core } = require("@adobe/aio-sdk");
  const logger = Core.Logger("customer-commerce-deleted-sender", {
    level: params.LOG_LEVEL || "info",
  });

  logger.info(
    `Sending customer deleted notification for ${data.fullName} (${data.email})`,
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
        subject: `Customer Deleted: ${data.fullName}`,
        html: `<h2>Customer Deleted</h2>
<p><strong>Customer ID:</strong> ${data.customerId}</p>
<p><strong>Name:</strong> ${data.fullName}</p>
<p><strong>Email:</strong> ${data.email}</p>
<p><strong>Deleted At:</strong> ${data.timestamp}</p>`,
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
  sendData,
};
