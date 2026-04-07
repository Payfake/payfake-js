import { PayfakeError } from "./errors.js";
import { AuthNamespace } from "./auth.js";
import { TransactionNamespace } from "./transaction.js";
import { ChargeNamespace } from "./charge.js";
import { CustomerNamespace } from "./customer.js";
import { ControlNamespace } from "./control.js";

const DEFAULT_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT = 30_000;

/**
 * The root Payfake SDK client.
 *
 * All API namespaces hang off this object, access them via
 * client.transaction, client.charge, client.customer etc.
 *
 * @example
 * import { createClient } from "payfake-js"
 *
 * const client = createClient({ secretKey: "sk_test_xxx" })
 * const tx = await client.transaction.initialize({ email: "...", amount: 10000 })
 */
export class Client {
  /**
   * @param {object} config
   * @param {string} config.secretKey - Merchant secret key (sk_test_xxx)
   * @param {string} [config.baseURL] - Payfake server URL. Defaults to http://localhost:8080
   * @param {number} [config.timeout] - Request timeout in ms. Defaults to 30000
   */
  constructor({
    secretKey,
    baseURL = DEFAULT_BASE_URL,
    timeout = DEFAULT_TIMEOUT,
  }) {
    this.secretKey = secretKey;
    this.baseURL = baseURL.replace(/\/$/, "");
    this.timeout = timeout;

    this.auth = new AuthNamespace(this);
    this.transaction = new TransactionNamespace(this);
    this.charge = new ChargeNamespace(this);
    this.customer = new CustomerNamespace(this);
    this.control = new ControlNamespace(this);
  }

  /**
   * _request is the single HTTP execution point for the entire SDK.
   *
   * Every namespace method calls this, auth headers, JSON serialization,
   * envelope unwrapping and error parsing happen exactly once here.
   *
   * @param {string} method - HTTP method
   * @param {string} path - API path e.g. /api/v1/transaction/initialize
   * @param {object|null} body - Request body (will be JSON serialized)
   * @param {string|null} token - JWT token for dashboard endpoints.
   *   If null, the secret key is used. If provided, it overrides the secret key.
   * @returns {Promise<any>} - Unwrapped data from the response envelope
   */
  async _request(method, path, body = null, token = null) {
    const url = `${this.baseURL}${path}`;

    // Use JWT token for dashboard/control endpoints, secret key otherwise.
    // This matches the two auth modes, secret key for app-level calls,
    // JWT for dashboard-level calls (scenario, logs, webhook management).
    const authValue = token ?? this.secretKey;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authValue) {
      headers["Authorization"] = `Bearer ${authValue}`;
    }

    const init = { method, headers };

    if (body !== null) {
      // _clean strips undefined/null values before serializing.
      // This implements the partial-update pattern, fields left
      // undefined in UpdateCustomerInput etc don't appear in the JSON,
      // so the API treats them as "don't touch this field".
      init.body = JSON.stringify(_clean(body));
    }

    // AbortController lets us cancel the fetch after the timeout.
    // fetch doesn't have a built-in timeout, this is the standard
    // pattern for adding one. The signal is passed to fetch and
    // AbortController.abort() is called after timeout ms.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    init.signal = controller.signal;

    let resp;
    try {
      resp = await fetch(url, init);
    } catch (err) {
      // fetch rejects on network errors and abort (timeout).
      if (err.name === "AbortError") {
        throw new PayfakeError(
          "REQUEST_TIMEOUT",
          `Request timed out after ${this.timeout}ms`,
        );
      }
      throw new PayfakeError("NETWORK_ERROR", `Network error: ${err.message}`);
    } finally {
      // Always clear the timer whether the request succeeded or failed.
      // Without clearTimeout the timer keeps the event loop alive
      // and prevents Node.js from exiting cleanly after the request.
      clearTimeout(timer);
    }

    let envelope;
    try {
      envelope = await resp.json();
    } catch {
      throw new PayfakeError(
        "PARSE_ERROR",
        `Failed to parse response as JSON (HTTP ${resp.status})`,
        [],
        resp.status,
      );
    }

    // Any non-success envelope is an error regardless of HTTP status.
    // We check the envelope status field, not resp.ok, because the
    // API always returns a structured envelope even on failure.
    if (envelope.status !== "success") {
      throw new PayfakeError(
        envelope.code ?? "UNKNOWN_ERROR",
        envelope.message ?? "An error occurred",
        envelope.errors ?? [],
        resp.status,
      );
    }

    return envelope.data ?? {};
  }
}

/**
 * _clean recursively removes null and undefined values from an object.
 * This enables the partial-update pattern across all SDK inputs.
 *
 * @param {any} value
 * @returns {any}
 */
function _clean(value) {
  if (Array.isArray(value)) {
    return value.map(_clean);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, _clean(v)]),
    );
  }
  return value;
}
