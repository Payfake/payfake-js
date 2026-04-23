/**
 * MerchantNamespace wraps /api/v1/merchant endpoints.
 * Payfake-specific, no Paystack equivalent.
 * Auth: Bearer JWT (from auth.login)
 */
export class MerchantNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Get the full merchant profile.
   * @param {string} token
   */
  async getProfile(token) {
    return this._client._doJWT("GET", "/api/v1/merchant", null, token);
  }

  /**
   * Update merchant business name and/or webhook URL.
   * @param {string} token
   * @param {{ businessName?: string, webhookUrl?: string }} input
   */
  async updateProfile(token, { businessName, webhookUrl } = {}) {
    return this._client._doJWT(
      "PUT",
      "/api/v1/merchant",
      {
        business_name: businessName,
        webhook_url: webhookUrl,
      },
      token,
    );
  }

  /**
   * Get the current webhook URL and whether it's configured.
   * @param {string} token
   */
  async getWebhookURL(token) {
    return this._client._doJWT("GET", "/api/v1/merchant/webhook", null, token);
  }

  /**
   * Set the merchant's webhook URL.
   * @param {string} token
   * @param {string} webhookUrl
   */
  async updateWebhookURL(token, webhookUrl) {
    return this._client._doJWT(
      "POST",
      "/api/v1/merchant/webhook",
      { webhook_url: webhookUrl },
      token,
    );
  }

  /**
   * Fire a test webhook to verify the endpoint is reachable.
   * Rate limited to 5 requests per minute per merchant.
   * @param {string} token
   */
  async testWebhook(token) {
    return this._client._doJWT(
      "POST",
      "/api/v1/merchant/webhook/test",
      null,
      token,
    );
  }
}
