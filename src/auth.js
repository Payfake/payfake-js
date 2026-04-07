/**
 * AuthNamespace wraps the /auth endpoints.
 *
 * Register and Login require no authentication.
 * GetKeys and RegenerateKeys require a JWT token from login().
 */
export class AuthNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Create a new merchant account.
   * Returns merchant data and a JWT token.
   *
   * @param {{ businessName: string, email: string, password: string }} input
   * @returns {Promise<{ merchant: object, token: string }>}
   */
  async register({ businessName, email, password }) {
    // We convert camelCase input to snake_case for the API.
    // JS developers expect camelCase, the API uses snake_case.
    // The SDK handles the conversion so callers never think about it.
    return this._client._request("POST", "/api/v1/auth/register", {
      business_name: businessName,
      email,
      password,
    });
  }

  /**
   * Authenticate a merchant and return a JWT token.
   * Store the token for use with control and key endpoints.
   *
   * @param {{ email: string, password: string }} input
   * @returns {Promise<{ merchant: object, token: string }>}
   */
  async login({ email, password }) {
    return this._client._request("POST", "/api/v1/auth/login", {
      email,
      password,
    });
  }

  /**
   * Fetch the merchant's current public and secret keys.
   * @param {string} token - JWT token from login()
   * @returns {Promise<{ publicKey: string, secretKey: string }>}
   */
  async getKeys(token) {
    const data = await this._client._request(
      "GET",
      "/api/v1/auth/keys",
      null,
      token,
    );
    // Convert snake_case response back to camelCase for JS consumers.
    return { publicKey: data.public_key, secretKey: data.secret_key };
  }

  /**
   * Generate a new key pair.
   * The old secret key is immediately invalid after this call.
   * Update your environment variables before calling this.
   *
   * @param {string} token - JWT token from login()
   * @returns {Promise<{ publicKey: string, secretKey: string }>}
   */
  async regenerateKeys(token) {
    const data = await this._client._request(
      "POST",
      "/api/v1/auth/keys/regenerate",
      null,
      token,
    );
    return { publicKey: data.public_key, secretKey: data.secret_key };
  }
}
