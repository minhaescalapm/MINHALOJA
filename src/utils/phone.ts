/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strips leading 55 if present on a Brazilian mobile/landline number of 12-13 digits,
 * and formats the remaining 10-11 digits using the standard Brazilian mask:
 * (DD) 9XXXX-XXXX or (DD) XXXX-XXXX.
 */
export function formatPhoneForInputDisplay(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  
  // If it starts with 55 and has country code length (12 or 13 digits), strip 55 for typing
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.substring(2);
  }
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
}

/**
 * Takes any typed phone number input (possibly formatted), cleans non-digits off,
 * and ensures it is prefixed with the Brazil country code '55' if it's 10/11 digits long.
 */
export function cleanAndFormatPhoneForSave(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  
  // If it has 10 or 11 digits (e.g. DDD + number), prepend Brazil country code '55'
  if (digits.length === 10 || digits.length === 11) {
    digits = "55" + digits;
  }
  return digits;
}
