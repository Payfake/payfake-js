/**
 * SDKError is thrown by every SDK method on failure.
 * Switch on code for programmatic error handling, never parse message.
 *
 * @example
 * try {
 *   await client.charge.submitOTP({ reference, otp })
 * } catch (err) {
 *   if (err instanceof PayfakeError && err.isCode(PayfakeError.CODE_INVALID_OTP)) {
 *     // resend OTP
 *   }
 * }
 */
export class PayfakeError extends Error {
  /**
   * @param {string} code - X-Payfake-Code header value
   * @param {string} message - Human-readable error message
   * @param {Array<{field: string, rule: string, message: string}>} fields - Field-level validation errors
   * @param {number} httpStatus - HTTP status code
   */
  constructor(code, message, fields = [], httpStatus = 0) {
    super(message);
    this.name = "PayfakeError";
    /** @type {string} */
    this.code = code;
    /** @type {string} */
    this.message = message;
    /** @type {Array<{field: string, rule: string, message: string}>} */
    this.fields = fields;
    /** @type {number} */
    this.httpStatus = httpStatus;
  }

  /**
   * Returns true if this error has the given Payfake code.
   * Use this instead of comparing error.code directly.
   * @param {string} code
   */
  isCode(code) {
    return this.code === code;
  }

  toString() {
    if (this.fields.length > 0) {
      const parts = this.fields
        .map((f) => `${f.field}: ${f.message}`)
        .join(", ");
      return `PayfakeError [${this.code}] ${this.message} — ${parts}`;
    }
    return `PayfakeError [${this.code}] ${this.message}`;
  }

  // Response code constants

  // Auth
  static CODE_EMAIL_TAKEN = "AUTH_EMAIL_TAKEN";
  static CODE_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
  static CODE_UNAUTHORIZED = "AUTH_UNAUTHORIZED";
  static CODE_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
  static CODE_TOKEN_INVALID = "AUTH_TOKEN_INVALID";

  // Transaction
  static CODE_TRANSACTION_NOT_FOUND = "TRANSACTION_NOT_FOUND";
  static CODE_REFERENCE_TAKEN = "TRANSACTION_REFERENCE_TAKEN";
  static CODE_INVALID_AMOUNT = "TRANSACTION_INVALID_AMOUNT";
  static CODE_ALREADY_VERIFIED = "TRANSACTION_ALREADY_VERIFIED";

  // Charge
  static CODE_CHARGE_FAILED = "CHARGE_FAILED";
  static CODE_CHARGE_SUCCESSFUL = "CHARGE_SUCCESSFUL";
  static CODE_SEND_PIN = "CHARGE_SEND_PIN";
  static CODE_SEND_OTP = "CHARGE_SEND_OTP";
  static CODE_SEND_BIRTHDAY = "CHARGE_SEND_BIRTHDAY";
  static CODE_SEND_ADDRESS = "CHARGE_SEND_ADDRESS";
  static CODE_OPEN_URL = "CHARGE_OPEN_URL";
  static CODE_PAY_OFFLINE = "CHARGE_PAY_OFFLINE";
  static CODE_INVALID_OTP = "CHARGE_INVALID_OTP";
  static CODE_INSUFFICIENT_FUNDS = "CHARGE_INSUFFICIENT_FUNDS";
  static CODE_DO_NOT_HONOR = "CHARGE_DO_NOT_HONOR";
  static CODE_MOMO_TIMEOUT = "CHARGE_MOMO_TIMEOUT";
  static CODE_MOMO_PROVIDER_UNAVAILABLE = "CHARGE_MOMO_PROVIDER_UNAVAILABLE";

  // Customer
  static CODE_CUSTOMER_NOT_FOUND = "CUSTOMER_NOT_FOUND";
  static CODE_CUSTOMER_EMAIL_TAKEN = "CUSTOMER_EMAIL_TAKEN";

  // Generic
  static CODE_VALIDATION_ERROR = "VALIDATION_ERROR";
  static CODE_INTERNAL_ERROR = "INTERNAL_ERROR";
  static CODE_NOT_FOUND = "NOT_FOUND";
  static CODE_RATE_LIMITED = "RATE_LIMIT_EXCEEDED";
}
