/**
 * CustomerNamespace wraps /customer endpoints.
 * These match https://api.paystack.co/customer exactly.
 * Auth: Bearer sk_test_xxx
 */
export class CustomerNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Create a new customer.
   * @param {{ email: string, first_name?: string, last_name?: string, phone?: string, metadata?: object }} input
   */
  async create(input) {
    return this._client._do("POST", "/customer", input);
  }

  /**
   * List customers with pagination.
   * @param {{ page?: number, perPage?: number }} opts
   */
  async list({ page = 1, perPage = 50 } = {}) {
    return this._client._do(
      "GET",
      `/customer?page=${page}&perPage=${perPage}`,
      null,
    );
  }

  /**
   * Fetch a customer by their code (CUS_xxxxxxxx).
   * @param {string} code
   */
  async fetch(code) {
    return this._client._do("GET", `/customer/${code}`, null);
  }

  /**
   * Partially update a customer.
   * Only fields present in the input are updated.
   *
   * @param {string} code
   * @param {{ first_name?: string, last_name?: string, phone?: string, metadata?: object }} input
   */
  async update(code, input) {
    return this._client._do("PUT", `/customer/${code}`, input);
  }

  /**
   * Get paginated transactions for a customer.
   * @param {string} code
   * @param {{ page?: number, perPage?: number }} opts
   */
  async transactions(code, { page = 1, perPage = 50 } = {}) {
    return this._client._do(
      "GET",
      `/customer/${code}/transactions?page=${page}&perPage=${perPage}`,
      null,
    );
  }
}
