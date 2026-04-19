/**
 * TransactionNamespace wraps the /transaction endpoints.
 * All methods require the secret key set on the client.
 */
export class TransactionNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Create a new pending transaction.
   * Returns the authorization URL for the payment popup and the
   * access code the popup uses to identify the transaction.
   *
   * @param {{
   *   email: string,
   *   amount: number,
   *   currency?: string,
   *   reference?: string,
   *   callbackUrl?: string,
   *   channels?: string[],
   *   metadata?: object
   * }} input
   * @returns {Promise<{ authorizationUrl: string, accessCode: string, reference: string }>}
   */
  async initialize({
    email,
    amount,
    currency,
    reference,
    callbackUrl,
    channels,
    metadata,
  }) {
    const data = await this._client._request(
      "POST",
      "/api/v1/transaction/initialize",
      {
        email,
        amount,
        currency,
        reference,
        // camelCase → snake_case conversion before sending to API
        callback_url: callbackUrl,
        channels,
        metadata,
      },
    );
    // snake_case → camelCase on the way back
    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  /**
   * Verify a transaction by reference.
   * Call this after the payment popup closes to confirm the outcome.
   *
   * @param {string} reference
   * @returns {Promise<object>} Transaction object
   */
  async verify(reference) {
    return this._client._request(
      "GET",
      `/api/v1/transaction/verify/${reference}`,
    );
  }

  /**
   * Fetch a single transaction by ID.
   *
   * @param {string} id
   * @returns {Promise<object>} Transaction object
   */
  async get(id) {
    return this._client._request("GET", `/api/v1/transaction/${id}`);
  }

  /**
   * List transactions with pagination.
   *
   * @param {{ page?: number, perPage?: number, status?: string }} opts
   * @returns {Promise<{ transactions: object[], meta: object }>}
   */
  async list({ page = 1, perPage = 50, status = "" } = {}) {
    let path = `/api/v1/transaction?page=${page}&per_page=${perPage}`;
    if (status) path += `&status=${status}`;
    return this._client._request("GET", path);
  }

  /**
   * Refund a successful transaction.
   * Only transactions with status "success" can be refunded.
   *
   * @param {string} id
   * @returns {Promise<object>} Updated transaction object
   */
  async refund(id) {
    return this._client._request("POST", `/api/v1/transaction/${id}/refund`);
  }

  /**
   * Load transaction details for the checkout page.
   * No secret key required — authenticated via access code in the URL.
   * Returns amount, merchant branding, customer email and charge flow status.
   * Call this on checkout page mount to hydrate the payment form.
   *
   * @param {string} accessCode
   * @returns {Promise<object>} PublicTransactionResponse
   *
   * @example
   * const tx = await client.transaction.publicFetch(accessCode)
   * console.log(`Pay ${tx.merchant.business_name} ${tx.currency} ${tx.amount / 100}`)
   */
  async publicFetch(accessCode) {
    return this._client._request(
      "GET",
      `/api/v1/public/transaction/${accessCode}`,
    );
  }

  /**
   * Poll transaction status for MoMo pay_offline state.
   * No secret key required. Check status and charge.flow_status each tick.
   * Stop polling when status is "success" or "failed".
   *
   * @param {string} reference
   * @returns {Promise<object>} PublicVerifyResponse
   *
   * @example
   * const poll = setInterval(async () => {
   *   const result = await client.transaction.publicVerify(reference)
   *   if (result.status === "success" || result.status === "failed") {
   *     clearInterval(poll)
   *     handleResult(result)
   *   }
   * }, 3000)
   */
  async publicVerify(reference) {
    return this._client._request(
      "GET",
      `/api/v1/public/transaction/verify/${reference}`,
    );
  }
}
