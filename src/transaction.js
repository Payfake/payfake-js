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
      authorizationUrl: data.authorizationUrl,
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
}
