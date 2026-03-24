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
 * This function send the customer updated dara to the external back-office application
 *
 * @param {object} params - include the env params
 * @param {object} data - Customer data
 * @param {object} preProcessed - result of the pre-process logic if any
 * @returns the sending result if needed for post process
 */
async function sendData(params, data, preProcessed) {
  const { Core } = require("@adobe/aio-sdk");
  const logger = Core.Logger("customer-commerce-updated-sender", {
    level: params.LOG_LEVEL || "info",
  });

  logger.info(
    `Customer updated event received for ${data.fullName} (${data.email}) — no email sent`,
  );

  return { success: true };
}

module.exports = {
  sendData,
};
