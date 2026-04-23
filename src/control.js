/**
 * ControlNamespace wraps /api/v1/control endpoints.
 * Payfake-specific, no Paystack equivalent.
 * Auth: Bearer JWT (from auth.login)
 */
export class ControlNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Get aggregated overview stats for the dashboard.
   * @param {string} token
   */
  async getStats(token) {
    return this._client._doJWT("GET", "/api/v1/control/stats", null, token);
  }

  /**
   * Get the current scenario config.
   * @param {string} token
   */
  async getScenario(token) {
    return this._client._doJWT("GET", "/api/v1/control/scenario", null, token);
  }

  /**
   * Update the scenario config.
   * Only fields present in input are updated.
   *
   * @param {string} token
   * @param {{ failureRate?: number, delayMs?: number, forceStatus?: string, errorCode?: string }} input
   *
   * @example
   * // Force all charges to fail with insufficient funds
   * await client.control.updateScenario(token, {
   *   forceStatus: "failed",
   *   errorCode:   "CHARGE_INSUFFICIENT_FUNDS",
   * })
   *
   * // 30% random failure with 2 second delay
   * await client.control.updateScenario(token, {
   *   failureRate: 0.3,
   *   delayMs:     2000,
   * })
   */
  async updateScenario(
    token,
    { failureRate, delayMs, forceStatus, errorCode } = {},
  ) {
    const body = {};
    if (failureRate !== undefined) body.failure_rate = failureRate;
    if (delayMs !== undefined) body.delay_ms = delayMs;
    if (forceStatus !== undefined) body.force_status = forceStatus;
    if (errorCode !== undefined) body.error_code = errorCode;
    return this._client._doJWT("PUT", "/api/v1/control/scenario", body, token);
  }

  /**
   * Reset scenario config to defaults.
   * After reset all charges succeed with no delay.
   * @param {string} token
   */
  async resetScenario(token) {
    return this._client._doJWT(
      "POST",
      "/api/v1/control/scenario/reset",
      null,
      token,
    );
  }

  /**
   * List transactions, JWT authenticated, for the dashboard.
   * Supports search by reference or customer email and status filter.
   *
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   * @param {string} [status]
   * @param {string} [search]
   */
  async listTransactions(
    token,
    { page = 1, perPage = 50 } = {},
    status = "",
    search = "",
  ) {
    let path = `/api/v1/control/transactions?page=${page}&perPage=${perPage}`;
    if (status) path += `&status=${status}`;
    if (search) path += `&search=${encodeURIComponent(search)}`;
    return this._client._doJWT("GET", path, null, token);
  }

  /**
   * List customers — JWT authenticated, for the dashboard.
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   */
  async listCustomers(token, { page = 1, perPage = 50 } = {}) {
    return this._client._doJWT(
      "GET",
      `/api/v1/control/customers?page=${page}&perPage=${perPage}`,
      null,
      token,
    );
  }

  /**
   * Force a pending transaction to a specific terminal state.
   * Bypasses the scenario engine, useful for deterministic test cases.
   *
   * @param {string} token
   * @param {string} reference
   * @param {{ status: string, errorCode?: string }} input
   */
  async forceTransaction(token, reference, { status, errorCode } = {}) {
    return this._client._doJWT(
      "POST",
      `/api/v1/control/transactions/${reference}/force`,
      { status, error_code: errorCode },
      token,
    );
  }

  /**
   * List webhook events.
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   */
  async listWebhooks(token, { page = 1, perPage = 50 } = {}) {
    return this._client._doJWT(
      "GET",
      `/api/v1/control/webhooks?page=${page}&perPage=${perPage}`,
      null,
      token,
    );
  }

  /**
   * Manually re-trigger delivery for a webhook event.
   * @param {string} token
   * @param {string} id
   */
  async retryWebhook(token, id) {
    return this._client._doJWT(
      "POST",
      `/api/v1/control/webhooks/${id}/retry`,
      null,
      token,
    );
  }

  /**
   * Get all delivery attempts for a webhook event.
   * @param {string} token
   * @param {string} id
   */
  async getWebhookAttempts(token, id) {
    return this._client._doJWT(
      "GET",
      `/api/v1/control/webhooks/${id}/attempts`,
      null,
      token,
    );
  }

  /**
   * Get paginated request/response introspection logs.
   * @param {string} token
   * @param {{ page?: number, perPage?: number }} opts
   */
  async getLogs(token, { page = 1, perPage = 50 } = {}) {
    return this._client._doJWT(
      "GET",
      `/api/v1/control/logs?page=${page}&perPage=${perPage}`,
      null,
      token,
    );
  }

  /**
   * Permanently delete all request logs for the merchant.
   * @param {string} token
   */
  async clearLogs(token) {
    return this._client._doJWT("DELETE", "/api/v1/control/logs", null, token);
  }

  /**
   * Get OTP codes generated during charge flows.
   * This is the primary way to read OTPs during testing without a real phone.
   *
   * @param {string} token
   * @param {string} [reference] - Filter for a specific transaction
   * @param {{ page?: number, perPage?: number }} opts
   *
   * @example
   * const logs = await client.control.getOTPLogs(token, tx.reference)
   * const otp = logs[0]?.otp_code
   */
  async getOTPLogs(token, reference = "", { page = 1, perPage = 50 } = {}) {
    let path = reference
      ? `/api/v1/control/otp-logs?reference=${reference}`
      : `/api/v1/control/otp-logs?page=${page}&perPage=${perPage}`;
    const data = await this._client._doJWT("GET", path, null, token);
    // Handle both flat array and paginated { data: [], meta: {} } shapes
    return Array.isArray(data) ? data : (data?.data ?? data);
  }
}
