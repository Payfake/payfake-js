import { Client } from "./client.js";
import { PayfakeError } from "./errors.js";
import { AuthNamespace } from "./auth.js";
import { TransactionNamespace } from "./transaction.js";
import { ChargeNamespace } from "./charge.js";
import { CustomerNamespace } from "./customer.js";
import { MerchantNamespace } from "./merchant.js";
import { ControlNamespace } from "./control.js";

/**
 * Create a new Payfake SDK client.
 *
 * @param {{
 *   secretKey: string,
 *   baseURL?: string,
 *   timeout?: number
 * }} config
 *
 * @example
 * import { createClient } from "payfake-js"
 *
 * const client = createClient({ secretKey: "sk_test_xxx" })
 *
 * // Self-hosted:
 * const client = createClient({
 *   secretKey: "sk_test_xxx",
 *   baseURL:   "http://localhost:8080",
 * })
 */
export function createClient({ secretKey, baseURL, timeout } = {}) {
  const httpClient = new Client(secretKey, baseURL, timeout);

  return {
    auth: new AuthNamespace(httpClient),
    transaction: new TransactionNamespace(httpClient),
    charge: new ChargeNamespace(httpClient),
    customer: new CustomerNamespace(httpClient),
    merchant: new MerchantNamespace(httpClient),
    control: new ControlNamespace(httpClient),
  };
}

export { PayfakeError };
