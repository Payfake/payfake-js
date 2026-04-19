/**
 * ChargeNamespace wraps all charge flow endpoints.
 * Every method returns a ChargeFlowResponse — read the status field
 * to determine what step comes next in the checkout flow.
 */
export class ChargeNamespace {
  /** @param {import("./client.js").Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Initiate a card charge.
   * Local Verve cards (5061, 5062, 5063, 6500, 6501) → status: "send_pin"
   * International Visa/Mastercard → status: "open_url" + three_ds_url
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   cardNumber: string,
   *   cardExpiry: string,
   *   cvv: string,
   *   email: string
   * }} input
   * @returns {Promise<ChargeFlowResponse>}
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
   * Always returns status: "send_otp" — customer verifies phone first.
   * After OTP returns "pay_offline" — poll transaction for webhook outcome.
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   phone: string,
   *   provider: "mtn"|"vodafone"|"airteltigo",
   *   email: string
   * }} input
   * @returns {Promise<ChargeFlowResponse>}
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
   * Returns status: "send_birthday" — customer enters date of birth first.
   *
   * @param {{
   *   accessCode?: string,
   *   reference?: string,
   *   bankCode: string,
   *   accountNumber: string,
   *   email: string
   * }} input
   * @returns {Promise<ChargeFlowResponse>}
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
   * Submit card PIN after status: "send_pin".
   * Returns status: "send_otp" — OTP sent to registered phone.
   * Read OTP from client.control.getOTPLogs(token, { reference }).
   *
   * @param {{ reference: string, pin: string }} input
   * @returns {Promise<ChargeFlowResponse>}
   */
  async submitPIN({ reference, pin }) {
    return this._client._request("POST", "/api/v1/charge/submit_pin", {
      reference,
      pin,
    });
  }

  /**
   * Submit OTP after status: "send_otp".
   * Card/bank: returns "success" or "failed".
   * MoMo: returns "pay_offline" — poll transaction for final outcome.
   *
   * @param {{ reference: string, otp: string }} input
   * @returns {Promise<ChargeFlowResponse>}
   */
  async submitOTP({ reference, otp }) {
    return this._client._request("POST", "/api/v1/charge/submit_otp", {
      reference,
      otp,
    });
  }

  /**
   * Submit date of birth after status: "send_birthday".
   * Returns status: "send_otp" on success.
   *
   * @param {{ reference: string, birthday: string }} input - birthday: YYYY-MM-DD
   * @returns {Promise<ChargeFlowResponse>}
   */
  async submitBirthday({ reference, birthday }) {
    return this._client._request("POST", "/api/v1/charge/submit_birthday", {
      reference,
      birthday,
    });
  }

  /**
   * Submit billing address after status: "send_address".
   * Returns "success" or "failed".
   *
   * @param {{
   *   reference: string,
   *   address: string,
   *   city: string,
   *   state: string,
   *   zipCode: string,
   *   country: string
   * }} input
   * @returns {Promise<ChargeFlowResponse>}
   */
  async submitAddress({ reference, address, city, state, zipCode, country }) {
    return this._client._request("POST", "/api/v1/charge/submit_address", {
      reference,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
    });
  }

  /**
   * Request a new OTP after status: "send_otp".
   * Invalidates the previous OTP. Returns "send_otp" with fresh OTP.
   * Read new OTP from client.control.getOTPLogs(token, { reference }).
   *
   * @param {{ reference: string }} input
   * @returns {Promise<ChargeFlowResponse>}
   */
  async resendOTP({ reference }) {
    return this._client._request("POST", "/api/v1/charge/resend_otp", {
      reference,
    });
  }

  /**
   * Complete the simulated 3DS verification.
   * Call this after the customer confirms on the checkout app's 3DS page.
   * Returns "success" or "failed" based on the scenario config.
   *
   * @param {string} reference - Transaction reference
   * @returns {Promise<ChargeFlowResponse>}
   */
  async simulate3DS(reference) {
    return this._client._request(
      "POST",
      `/api/v1/public/simulate/3ds/${reference}`,
    );
  }

  /**
   * Fetch the current state of a charge by transaction reference.
   *
   * @param {string} reference
   * @returns {Promise<object>}
   */
  async fetch(reference) {
    return this._client._request("GET", `/api/v1/charge/${reference}`);
  }
}
