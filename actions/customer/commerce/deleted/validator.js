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
 * This function validate the customer data received
 *
 * @param {object} data - Received data from adobe commerce
 * @returns the result of validation object
 */
function validateData(data) {
  if (!data || typeof data !== "object") {
    return { success: false, message: "Customer data is required" };
  }

  if (!data.email || typeof data.email !== "string" || !data.email.trim()) {
    return { success: false, message: "Customer email is required" };
  }

  if (
    !data.firstname ||
    typeof data.firstname !== "string" ||
    !data.firstname.trim()
  ) {
    return { success: false, message: "Customer firstname is required" };
  }

  if (
    !data.lastname ||
    typeof data.lastname !== "string" ||
    !data.lastname.trim()
  ) {
    return { success: false, message: "Customer lastname is required" };
  }

  return { success: true };
}

module.exports = {
  validateData,
};
