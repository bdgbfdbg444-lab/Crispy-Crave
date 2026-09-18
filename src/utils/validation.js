/**
 * Shared Validation Utility
 * Centralizes validation patterns used across the frontend to match
 * Firebase Rules backend strictness exactly.
 */

// Egyptian phone number format - must match database.rules.json: /^01[0125][0-9]{8}$/
export const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

// Link injection patterns - must match database.rules.json notes validation
export const LINK_INJECTION_REGEX = /http|https|www\.|\.com|\.net|me\/pay/gi;

// Maximum notes length - must match database.rules.json: newData.child('notes').val().length <= 150
export const MAX_NOTES_LENGTH = 150;

/**
 * Validates an Egyptian phone number.
 * @param {string} phone - Phone number to validate
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEgyptPhone(phone) {
  const cleaned = (phone || '').trim();
  if (!cleaned) {
    return { isValid: false, error: 'رقم الهاتف مطلوب' };
  }
  if (!EGYPT_PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 01 ويتكون من 11 رقماً.' };
  }
  return { isValid: true, error: '' };
}

/**
 * Sanitizes order notes: strips injected links and enforces length limit.
 * @param {string} notes - Raw user notes
 * @returns {string} - Clean notes
 */
export function sanitizeOrderNotes(notes) {
  if (!notes || typeof notes !== 'string') return '';
  let clean = notes.trim().substring(0, MAX_NOTES_LENGTH);
  clean = clean.replace(LINK_INJECTION_REGEX, '[رابط محظور]');
  return clean;
}
