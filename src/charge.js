/**
 * ChargeNamespace wraps the /charge endpoints.
 * All methods require the secret key set on the client.
 */
export class ChargeNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Charge a card directly.
   * Provide either accessCode (popup flow) or reference (direct API flow).
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   cardNumber: string,
   *   cardExpiry: string,
   *   cvv: string,
   *   email: string
   * }} input
   * @returns {Promise<{ transaction: object, charge: object }>}
   */
  async card({ accessCode, reference, cardNumber, cardExpiry, cvv, email }) {
    return this._client._request("POST", "/api/v1/charge/card", {
      access_code: accessCode,
      reference,
      card_number: cardNumber,
      card_expiry: cardExpiry,
      cvv,
      email,
    });
  }

  /**
   * Initiate a mobile money charge.
   * Always returns immediately with status "pending".
   * The final outcome arrives via webhook after the simulated delay.
   * Always implement a webhook handler for MoMo, never assume
   * pending means success and never poll for the result.
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   phone: string,
   *   provider: "mtn" | "vodafone" | "airteltigo",
   *   email: string
   * }} input
   * @returns {Promise<{ transaction: object, charge: object }>}
   */
  async mobileMoney({ accessCode, reference, phone, provider, email }) {
    return this._client._request("POST", "/api/v1/charge/mobile_money", {
      access_code: accessCode,
      reference,
      phone,
      provider,
      email,
    });
  }

  /**
   * Initiate a bank transfer charge.
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   bankCode: string,
   *   accountNumber: string,
   *   email: string
   * }} input
   * @returns {Promise<{ transaction: object, charge: object }>}
   */
  async bank({ accessCode, reference, bankCode, accountNumber, email }) {
    return this._client._request("POST", "/api/v1/charge/bank", {
      access_code: accessCode,
      reference,
      bank_code: bankCode,
      account_number: accountNumber,
      email,
    });
  }

  /**
   * Fetch a charge by transaction reference.
   *
   * @param {string} reference
   * @returns {Promise<object>} Charge object
   */
  async fetch(reference) {
    return this._client._request("GET", `/api/v1/charge/${reference}`);
  }
}
