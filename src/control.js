/**
 * ControlNamespace wraps the /control endpoints, Payfake's power layer.
 * All methods require a JWT token from client.auth.login().
 * These are dashboard operations, not application-level API calls.
 */
export class ControlNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Fetch the current scenario config for the merchant.
   *
   * @param {string} token - JWT from login()
   * @returns {Promise<object>} ScenarioConfig object
   */
  async getScenario(token) {
    return this._client._request(
      "GET",
      "/api/v1/control/scenario",
      null,
      token,
    );
  }

  /**
   * Update the scenario config.
   * Only non-undefined fields are sent.
   *
   * @param {string} token
   * @param {{
   *   failureRate?: number,
   *   delayMs?: number,
   *   forceStatus?: string,
   *   errorCode?: string
   * }} input
   * @returns {Promise<object>} Updated ScenarioConfig
   *
   * @example
   * // 30% failure rate with 1 second delay
   * await client.control.updateScenario(token, { failureRate: 0.3, delayMs: 1000 })
   *
   * // Force all charges to fail with insufficient funds
   * await client.control.updateScenario(token, {
   *   forceStatus: "failed",
   *   errorCode: "CHARGE_INSUFFICIENT_FUNDS"
   * })
   */
  async updateScenario(
    token,
    { failureRate, delayMs, forceStatus, errorCode } = {},
  ) {
    return this._client._request(
      "PUT",
      "/api/v1/control/scenario",
      {
        failure_rate: failureRate,
        delay_ms: delayMs,
        force_status: forceStatus,
        error_code: errorCode,
      },
      token,
    );
  }

  /**
   * Reset scenario config to defaults.
   * After reset: failureRate=0, delayMs=0, no forced status.
   * All charges will succeed instantly.
   *
   * @param {string} token
   * @returns {Promise<object>} Reset ScenarioConfig
   */
  async resetScenario(token) {
    return this._client._request(
      "POST",
      "/api/v1/control/scenario/reset",
      null,
      token,
    );
  }

  /**
   * List webhook events with delivery status.
   *
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   * @returns {Promise<{ webhooks: object[], meta: object }>}
   */
  async listWebhooks(token, { page = 1, perPage = 50 } = {}) {
    return this._client._request(
      "GET",
      `/api/v1/control/webhooks?page=${page}&per_page=${perPage}`,
      null,
      token,
    );
  }

  /**
   * Manually re-trigger delivery for a failed webhook event.
   *
   * @param {string} token
   * @param {string} webhookId
   * @returns {Promise<void>}
   */
  async retryWebhook(token, webhookId) {
    await this._client._request(
      "POST",
      `/api/v1/control/webhooks/${webhookId}/retry`,
      null,
      token,
    );
  }

  /**
   * Fetch all delivery attempts for a webhook event.
   *
   * @param {string} token
   * @param {string} webhookId
   * @returns {Promise<{ attempts: object[] }>}
   */
  async getWebhookAttempts(token, webhookId) {
    return this._client._request(
      "GET",
      `/api/v1/control/webhooks/${webhookId}/attempts`,
      null,
      token,
    );
  }

  /**
   * Force a pending transaction to a specific terminal state.
   * Bypasses the scenario engine entirely, the outcome is always
   * exactly what you specify.
   *
   * @param {string} token
   * @param {string} reference - Transaction reference
   * @param {{ status: "success"|"failed"|"abandoned", errorCode?: string }} input
   * @returns {Promise<object>} Updated transaction object
   */
  async forceTransaction(token, reference, { status, errorCode } = {}) {
    return this._client._request(
      "POST",
      `/api/v1/control/transactions/${reference}/force`,
      { status, error_code: errorCode },
      token,
    );
  }

  /**
   * Fetch paginated request/response introspection logs.
   *
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   * @returns {Promise<{ logs: object[], meta: object }>}
   */
  async getLogs(token, { page = 1, perPage = 50 } = {}) {
    return this._client._request(
      "GET",
      `/api/v1/control/logs?page=${page}&per_page=${perPage}`,
      null,
      token,
    );
  }

  /**
   * Permanently delete all logs for the merchant.
   *
   * @param {string} token
   * @returns {Promise<void>}
   */
  async clearLogs(token) {
    await this._client._request("DELETE", "/api/v1/control/logs", null, token);
  }

  /**
   * Fetch OTP codes generated during charge flows.
   * Pass reference to filter for a specific transaction.
   * This is the primary way to read OTPs during testing without a real phone.
   *
   * @param {string} token
   * @param {{ reference?: string, page?: number, perPage?: number }} opts
   * @returns {Promise<OTPLog[]>}
   *
   * @example
   * const logs = await client.control.getOTPLogs(token, { reference: tx.reference })
   * console.log("OTP:", logs[0].otp_code)
   */
  async getOTPLogs(token, { reference = "", page = 1, perPage = 50 } = {}) {
    let path = `/api/v1/control/otp-logs`;
    if (reference) {
      path += `?reference=${reference}`;
    } else {
      path += `?page=${page}&per_page=${perPage}`;
    }
    const data = await this._client._request("GET", path, null, token);
    return data.otp_logs ?? [];
  }

  /**
   * List transactions — JWT authenticated, for the dashboard.
   * Supports status filter and search by reference or customer email.
   *
   * @param {string} token
   * @param {{ page?: number, perPage?: number, status?: string, search?: string }} opts
   */
  async listTransactions(
    token,
    { page = 1, perPage = 50, status = "", search = "" } = {},
  ) {
    let path = `/api/v1/control/transactions?page=${page}&per_page=${perPage}`;
    if (status) path += `&status=${status}`;
    if (search) path += `&search=${encodeURIComponent(search)}`;
    return this._client._request("GET", path, null, token);
  }

  /**
   * List customers — JWT authenticated, for the dashboard.
   *
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   */
  async listCustomers(token, { page = 1, perPage = 50 } = {}) {
    return this._client._request(
      "GET",
      `/api/v1/control/customers?page=${page}&per_page=${perPage}`,
      null,
      token,
    );
  }
}
