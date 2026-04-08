/**
 * payfake-js
 * JavaScript SDK for Payfake, African payment simulator
 *
 * @example
 * import { createClient, PayfakeError } from "payfake-js"
 *
 * const client = createClient({ secretKey: "sk_test_xxx" })
 *
 * const tx = await client.transaction.initialize({
 *   email: "customer@example.com",
 *   amount: 10000,
 *   currency: "GHS",
 * })
 *
 * const charge = await client.charge.card({
 *   accessCode: tx.accessCode,
 *   cardNumber: "4111111111111111",
 *   cardExpiry: "12/26",
 *   cvv: "123",
 *   email: "customer@example.com",
 * })
 *
 * console.log(charge.transaction.status) // "success" or "failed"
 */

import { Client } from "./client.js";
export { PayfakeError } from "./errors.js";

/**
 * createClient is the recommended way to instantiate the SDK.
 * It's a thin wrapper over new Client(), exists purely so callers
 * don't need to import and new the class separately.
 *
 * @param {object} config
 * @param {string} config.secretKey
 * @param {string} [config.baseURL]
 * @param {number} [config.timeout]
 * @returns {Client}
 */
export function createClient(config) {
  return new Client(config);
}
