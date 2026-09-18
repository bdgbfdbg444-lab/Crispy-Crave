/**
 * Input Sanitization Utility (Thoghra 28: XSS Sanitization Shield)
 * Strips and neutralizes potentially malicious script tags, event handlers,
 * and dangerous HTML entities from customer-provided inputs before processing or storage.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*(['"]).*?\1/gi,
  /on\w+\s*=\s*[^>\s]+/gi
];

/**
 * Sanitizes a single string input.
 * @param {string} input - Raw user input text
 * @param {number} [maxLength=500] - Maximum allowed length
 * @returns {string} - Clean, sanitized string
 */
export function sanitizeText(input, maxLength = 500) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return String(input);

  let clean = input;

  // 1. Strip dangerous executable blocks and protocol schemes
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '');
  }

  // 2. Escape dangerous HTML structural characters
  clean = clean
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // 3. Trim and enforce length limit to prevent buffer / DOS bloating
  clean = clean.trim();
  if (maxLength > 0 && clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  return clean;
}

/**
 * Recursively sanitizes string properties inside an object.
 * @param {object} obj - Object containing user input fields
 * @returns {object} - Shallow clone with sanitized strings
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
