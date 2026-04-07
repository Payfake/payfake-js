/**
 * CustomerNamespace wraps the /customer endpoints.
 * All methods require the secret key set on the client.
 */
export class CustomerNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Create a new customer under the merchant account.
   *
   * @param {{
   *   email: string,
   *   firstName?: string,
   *   lastName?: string,
   *   phone?: string,
   *   metadata?: object
   * }} input
   * @returns {Promise<object>} Customer object
   */
  async create({ email, firstName, lastName, phone, metadata }) {
    return this._client._request("POST", "/api/v1/customer", {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      metadata,
    });
  }

  /**
   * List customers with pagination.
   *
   * @param {{ page?: number, perPage?: number }} opts
   * @returns {Promise<{ customers: object[], meta: object }>}
   */
  async list({ page = 1, perPage = 50 } = {}) {
    return this._client._request(
      "GET",
      `/api/v1/customer?page=${page}&per_page=${perPage}`,
    );
  }

  /**
   * Fetch a customer by their code (CUS_xxxxxxxx).
   *
   * @param {string} code
   * @returns {Promise<object>} Customer object
   */
  async get(code) {
    return this._client._request("GET", `/api/v1/customer/${code}`);
  }

  /**
   * Partially update a customer.
   * Only non-undefined fields are sent, undefined means "don't touch".
   *
   * @param {string} code
   * @param {{
   *   firstName?: string,
   *   lastName?: string,
   *   phone?: string,
   *   metadata?: object
   * }} input
   * @returns {Promise<object>} Updated customer object
   */
  async update(code, { firstName, lastName, phone, metadata } = {}) {
    return this._client._request("PUT", `/api/v1/customer/${code}`, {
      first_name: firstName,
      last_name: lastName,
      phone,
      metadata,
    });
  }

  /**
   * Fetch paginated transactions for a specific customer.
   *
   * @param {string} code
   * @param {{ page?: number, perPage?: number }} opts
   * @returns {Promise<{ transactions: object[], meta: object }>}
   */
  async transactions(code, { page = 1, perPage = 50 } = {}) {
    return this._client._request(
      "GET",
      `/api/v1/customer/${code}/transactions?page=${page}&per_page=${perPage}`,
    );
  }
}
