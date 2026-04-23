/**
 * AuthNamespace wraps /api/v1/auth endpoints.
 * Payfake-specific, no Paystack equivalent.
 * Use the returned access_token with Control and Merchant methods.
 */
export class AuthNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Register a new merchant account.
   * Returns merchant profile and access_token.
   *
   * @param {{ business_name: string, email: string, password: string }} input
   */
  async register(input) {
    return this._client._doJWT("POST", "/api/v1/auth/register", input, null);
  }

  /**
   * Login and get an access token.
   *
   * @param {{ email: string, password: string }} input
   */
  async login(input) {
    return this._client._doJWT("POST", "/api/v1/auth/login", input, null);
  }

  /**
   * Get the currently authenticated merchant profile.
   * @param {string} token
   */
  async me(token) {
    return this._client._doJWT("GET", "/api/v1/auth/me", null, token);
  }

  /**
   * Get the merchant's public and secret keys.
   * @param {string} token
   */
  async getKeys(token) {
    return this._client._doJWT("GET", "/api/v1/auth/keys", null, token);
  }

  /**
   * Rotate the merchant's key pair.
   * All requests using the old secret key fail immediately after this call.
   * @param {string} token
   */
  async regenerateKeys(token) {
    return this._client._doJWT(
      "POST",
      "/api/v1/auth/keys/regenerate",
      null,
      token,
    );
  }
}
