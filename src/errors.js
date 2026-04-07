/**
 * PayfakeError is thrown by every SDK method on API failure.
 *
 * Use the `code` property for programmatic error handling, never
 * parse the message string since message text may change between
 * API versions but codes are stable.
 *
 * @example
 * try {
 *   await client.transaction.initialize(input)
 * } catch (err) {
 *   if (err instanceof PayfakeError && err.code === PayfakeError.CODE_REFERENCE_TAKEN) {
 *     // handle duplicate reference
 *   }
 *   throw err
 * }
 */
export class PayfakeError extends Error {
  // Common error codes as static constants so callers never
  // use raw strings. PayfakeError.CODE_EMAIL_TAKEN is refactor-safe,
  // "AUTH_EMAIL_TAKEN" scattered across a codebase is not.
  static CODE_EMAIL_TAKEN = "AUTH_EMAIL_TAKEN";
  static CODE_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
  static CODE_UNAUTHORIZED = "AUTH_UNAUTHORIZED";
  static CODE_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
  static CODE_TRANSACTION_NOT_FOUND = "TRANSACTION_NOT_FOUND";
  static CODE_REFERENCE_TAKEN = "TRANSACTION_REFERENCE_TAKEN";
  static CODE_INVALID_AMOUNT = "TRANSACTION_INVALID_AMOUNT";
  static CODE_CHARGE_FAILED = "CHARGE_FAILED";
  static CODE_CHARGE_PENDING = "CHARGE_PENDING";
  static CODE_CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND";
  static CODE_CUSTOMER_EMAIL_TAKEN = "CUSTOMER_EMAIL_TAKEN";
  static CODE_VALIDATION_ERROR = "VALIDATION_ERROR";
  static CODE_INTERNAL_ERROR = "INTERNAL_ERROR";

  /**
   * @param {string} code - Payfake response code e.g. AUTH_EMAIL_TAKEN
   * @param {string} message - Human readable error message
   * @param {Array<{field: string, message: string}>} fields - Field level errors
   * @param {number} httpStatus - HTTP status code of the failed response
   */
  constructor(code, message, fields = [], httpStatus = 0) {
    super(PayfakeError._format(code, message, fields));
    this.name = "PayfakeError";
    this.code = code;
    this.message = message;
    this.fields = fields;
    this.httpStatus = httpStatus;
  }

  static _format(code, message, fields) {
    if (fields.length > 0) {
      const fieldMessages = fields
        .map((f) => `${f.field}: ${f.message}`)
        .join(", ");
      return `payfake [${code}] ${message} — ${fieldMessages}`;
    }
    return `payfake [${code}] ${message}`;
  }

  /**
   * Check if this error matches a specific response code.
   * @param {string} code
   * @returns {boolean}
   */
  isCode(code) {
    return this.code === code;
  }
}
