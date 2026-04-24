/**
 * ChargeNamespace wraps /charge endpoints.
 * These match https://api.paystack.co/charge exactly.
 * All methods call POST /charge, channel detected from body object.
 * Auth: Bearer sk_test_xxx
 */
export class ChargeNamespace {
  /** @param {import('./client.js').Client} client */
  constructor(client) {
    this._client = client;
  }

  /**
   * Initiate a card charge via POST /charge.
   *
   * Local Ghana cards (Verve: 5061, 5062, 5063, 6500, 6501):
   *   returns status "send_pin" → call submitPIN
   *
   * International cards (Visa 4xxx, Mastercard 5xxx):
   *   returns status "open_url" + url → checkout navigates to url
   *
   * @param {{
   *   email: string,
   *   amount?: number,
   *   reference: string,
   *   card: { number: string, cvv: string, expiryMonth: string, expiryYear: string }
   * }} input
   */
  async card({ email, amount, reference, card }) {
    return this._client._do("POST", "/charge", {
      email,
      amount,
      reference,
      card: card
        ? {
            number: card.number,
            cvv: card.cvv,
            expiry_month: card.expiryMonth,
            expiry_year: card.expiryYear,
          }
        : undefined,
    });
  }

  /**
   * Initiate a MoMo charge via POST /charge.
   * Returns status "send_otp" → call submitOTP.
   * After OTP returns "pay_offline" → poll transaction.publicVerify.
   *
   * @param {{
   *   email: string,
   *   amount?: number,
   *   reference: string,
   *   mobileMoney: { phone: string, provider: "mtn" | "vodafone" | "airteltigo" }
   * }} input
   */
  async mobileMoney({ email, amount, reference, mobileMoney }) {
    return this._client._do("POST", "/charge", {
      email,
      amount,
      reference,
      mobile_money: mobileMoney
        ? {
            phone: mobileMoney.phone,
            provider: mobileMoney.provider,
          }
        : undefined,
    });
  }

  /**
   * Initiate a bank transfer charge via POST /charge.
   * Returns status "send_birthday" → call submitBirthday.
   *
   * @param {{
   *   email: string,
   *   amount?: number,
   *   reference: string,
   *   bank: { code: string, accountNumber: string },
   *   birthday?: string
   * }} input
   */
  async bank({ email, amount, reference, bank, birthday }) {
    return this._client._do("POST", "/charge", {
      email,
      amount,
      reference,
      birthday,
      bank: bank
        ? {
            code: bank.code,
            account_number: bank.accountNumber,
          }
        : undefined,
    });
  }

  /**
   * Submit card PIN after status "send_pin".
   * Returns status "send_otp", OTP sent to registered phone.
   * Read OTP from control.getOTPLogs during testing (no real phone needed).
   *
   * @param {{ reference: string, pin: string }} input
   */
  async submitPIN({ reference, pin }) {
    return this._client._do("POST", "/charge/submit_pin", { reference, pin });
  }

  /**
   * Submit OTP after status "send_otp".
   * Card/bank: returns "success" or "failed".
   * MoMo: returns "pay_offline", poll transaction.publicVerify for final outcome.
   *
   * @param {{ reference: string, otp: string }} input
   */
  async submitOTP({ reference, otp }) {
    return this._client._do("POST", "/charge/submit_otp", { reference, otp });
  }

  /**
   * Submit date of birth after status "send_birthday".
   * Returns status "send_otp" on success.
   *
   * @param {{ reference: string, birthday: string }} input - birthday: YYYY-MM-DD
   */
  async submitBirthday({ reference, birthday }) {
    return this._client._do("POST", "/charge/submit_birthday", {
      reference,
      birthday,
    });
  }

  /**
   * Submit billing address after status "send_address".
   * Returns "success" or "failed".
   *
   * @param {{ reference: string, address: string, city: string, state: string, zipCode: string, country: string }} input
   */
  async submitAddress({ reference, address, city, state, zipCode, country }) {
    return this._client._do("POST", "/charge/submit_address", {
      reference,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
    });
  }

  /**
   * Request a fresh OTP when the customer hasn't received one.
   * Invalidates the previous OTP. Returns status "send_otp".
   * Read the new OTP from control.getOTPLogs.
   *
   * @param {{ reference: string }} input
   */
  async resendOTP({ reference }) {
    return this._client._do("POST", "/charge/resend_otp", { reference });
  }

  /**
   * Fetch the current state of a charge by transaction reference.
   * @param {string} reference
   */
  async fetch(reference) {
    return this._client._do("GET", `/charge/${reference}`, null);
  }

  /**
   * Complete the simulated 3DS verification.
   * Called by the checkout app after the customer confirms on the 3DS page.
   * Returns "success" or "failed" based on the scenario config.
   *
   * @param {string} reference
   */
  async simulate3DS(reference) {
    return this._client._doPublic(
      "POST",
      `/api/v1/public/simulate/3ds/${reference}`,
      null,
    );
  }
}
