/**
 * TransactionNamespace wraps /transaction endpoints.
 * These match https://api.paystack.co/transaction exactly.
 * Auth: Bearer sk_test_xxx
 */
export class TransactionNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Create a new pending transaction.
   * Returns { authorization_url, access_code, reference }.
   * Redirect your customer to authorization_url to open the checkout page.
   *
   * @param {{ email: string, amount: number, currency?: string, reference?: string, callback_url?: string, metadata?: object }} input
   */
  async initialize(input) {
    return this._client._do("POST", "/transaction/initialize", input);
  }

  /**
   * Verify a transaction by reference.
   * Always call this before delivering value, never trust the callback URL alone.
   *
   * @param {string} reference
   */
  async verify(reference) {
    return this._client._do("GET", `/transaction/verify/${reference}`, null);
  }

  /**
   * Fetch a transaction by ID.
   * @param {string} id
   */
  async fetch(id) {
    return this._client._do("GET", `/transaction/${id}`, null);
  }

  /**
   * List transactions with pagination.
   * @param {{ page?: number, perPage?: number }} opts
   * @param {string} [status] - Filter: "success" | "failed" | "pending" | "abandoned"
   */
  async list({ page = 1, perPage = 50 } = {}, status = "") {
    let path = `/transaction?page=${page}&perPage=${perPage}`;
    if (status) path += `&status=${status}`;
    return this._client._do("GET", path, null);
  }

  /**
   * Refund (reverse) a successful transaction.
   * @param {string} id
   */
  async refund(id) {
    return this._client._do("POST", `/transaction/${id}/refund`, null);
  }

  /**
   * Load transaction details for the checkout page using the access code.
   * No secret key required. Returns merchant branding, amount, currency
   * and current charge flow status.
   * Call this on checkout page mount.
   *
   * @param {string} accessCode
   */
  async publicFetch(accessCode) {
    return this._client._doPublic(
      "GET",
      `/api/v1/public/transaction/${accessCode}`,
      null,
    );
  }

  /**
   * Poll transaction status for MoMo pay_offline state.
   * No secret key required. Poll every 3 seconds, stop when status is
   * "success" or "failed".
   *
   * @param {string} reference
   * @param {string} access_code
   *
   * @example
   * const poll = setInterval(async () => {
   *   const result = await client.transaction.publicVerify(reference, access_code)
   *   if (result.status === "success" || result.status === "failed") {
   *     clearInterval(poll)
   *   }
   * }, 3000)
   */
  async publicVerify(reference, access_code) {
    return this._client._doPublic(
      "GET",
      `/api/v1/public/transaction/verify/${reference}?access_code=${access_code}`,
      null,
    );
  }
}
