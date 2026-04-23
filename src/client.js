import { PayfakeError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.payfake.co";
const DEFAULT_TIMEOUT = 30_000;

/**
 * Base HTTP client used by all namespaces.
 * Handles auth headers, JSON serialization, Paystack envelope parsing,
 * and error extraction from X-Payfake-Code header.
 */
export class Client {
  /**
   * @param {string} secretKey - Merchant sk_test_xxx key
   * @param {string} baseURL
   * @param {number} timeout - Milliseconds
   */
  constructor(secretKey, baseURL, timeout) {
    this._secretKey = secretKey;
    this._baseURL = (baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this._timeout = timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Authenticated request using the secret key.
   * Used for all Paystack-compatible endpoints (/transaction, /charge, /customer).
   */
  async _do(method, path, body) {
    return this._request(method, path, body, this._secretKey);
  }

  /**
   * Authenticated request using a JWT token.
   * Used for Payfake-specific endpoints (/api/v1/auth, /api/v1/control, /api/v1/merchant).
   */
  async _doJWT(method, path, body, token) {
    return this._request(method, path, body, token);
  }

  /**
   * Unauthenticated request.
   * Used for public checkout endpoints (/api/v1/public/*).
   */
  async _doPublic(method, path, body) {
    return this._request(method, path, body, null);
  }

  async _request(method, path, body, token) {
    const url = this._baseURL + path;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const init = { method, headers };
    if (body != null) {
      init.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);
    init.signal = controller.signal;

    let resp;
    try {
      resp = await fetch(url, init);
    } catch (err) {
      if (err.name === "AbortError") {
        throw new PayfakeError(
          "REQUEST_TIMEOUT",
          `Request timed out after ${this._timeout}ms`,
        );
      }
      throw new PayfakeError("NETWORK_ERROR", err.message);
    } finally {
      clearTimeout(timer);
    }

    let envelope;
    try {
      envelope = await resp.json();
    } catch {
      throw new PayfakeError(
        "PARSE_ERROR",
        `Failed to parse response (HTTP ${resp.status})`,
        [],
        resp.status,
      );
    }

    // status is a boolean in the Paystack/Payfake envelope.
    // false means an error regardless of HTTP status code.
    if (envelope.status !== true) {
      // Flatten the errors map { field: [{ rule, message }] } into a flat array.
      const fields = [];
      for (const [fieldName, rules] of Object.entries(envelope.errors ?? {})) {
        for (const rule of rules) {
          fields.push({
            field: fieldName,
            rule: rule.rule,
            message: rule.message,
          });
        }
      }
      // Error code travels in the X-Payfake-Code header, not the body.
      throw new PayfakeError(
        resp.headers.get("X-Payfake-Code") ?? "UNKNOWN_ERROR",
        envelope.message ?? "An error occurred",
        fields,
        resp.status,
      );
    }

    return envelope.data;
  }
}
