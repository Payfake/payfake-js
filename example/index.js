// example/index.js
import { createClient, PayfakeError } from "../src/index.js";

/**
 * Example usage of the Payfake JS SDK
 *
 * This demonstrates the complete flow:
 * 1. Authentication (register/login)
 * 2. Retrieving API keys
 * 3. Initializing transactions
 * 4. Processing card payments
 * 5. Verifying transactions
 * 6. Mobile money payments
 * 7. Control panel operations (testing scenarios)
 */

// Create a client for authentication endpoints
// No secret key is required for auth operations
const authClient = createClient({
  secretKey: "",
  baseURL: "http://localhost:8080",
});

async function main() {
  // STEP 1: Authentication, Register or Login

  let authToken;

  try {
    const reg = await authClient.auth.register({
      businessName: "Acme Store",
      email: "dev@acme.com",
      password: "secret123",
    });
    console.log("Registered:", reg.merchant.id);
    authToken = reg.token;
  } catch (err) {
    // If the email is already registered, log in instead
    if (
      err instanceof PayfakeError &&
      err.isCode(PayfakeError.CODE_EMAIL_TAKEN)
    ) {
      const login = await authClient.auth.login({
        email: "dev@acme.com",
        password: "secret123",
      });
      authToken = login.token;
      console.log("Logged in as:", login.merchant.email);
    } else {
      throw err;
    }
  }

  // STEP 2: Retrieve API Keys

  const keys = await authClient.auth.getKeys(authToken);
  console.log("\nAPI Keys retrieved:");
  console.log("Public Key:", keys.publicKey);
  console.log("Secret Key:", keys.secretKey.substring(0, 10) + "...");

  // STEP 3: Create Authenticated Client

  // This client uses the secret key for payment operations
  const client = createClient({
    secretKey: keys.secretKey,
    baseURL: "http://localhost:8080",
  });

  // STEP 4: Initialize a Transaction

  // ── Full local card flow ──────────────────────────────────────
  const tx = await client.transaction.initialize({
    email: "customer@example.com",
    amount: 10000,
    currency: "GHS",
  });
  console.log("Reference:", tx.reference);

  // Step 1 — local Verve card → send_pin
  const step1 = await client.charge.card({
    accessCode: tx.accessCode,
    cardNumber: "5061000000000000",
    cardExpiry: "12/26",
    cvv: "123",
    email: "customer@example.com",
  });
  console.log("Step 1:", step1.status); // send_pin

  // Step 2 — submit PIN → send_otp
  const step2 = await client.charge.submitPIN({
    reference: tx.reference,
    pin: "1234",
  });
  console.log("Step 2:", step2.status); // send_otp

  // Step 3 — read OTP from logs
  const otpLogs = await client.control.getOTPLogs(token, {
    reference: tx.reference,
  });
  const otpCode = otpLogs[0]?.otp_code;
  console.log("OTP:", otpCode);

  // Step 4 — submit OTP → success
  const step3 = await client.charge.submitOTP({
    reference: tx.reference,
    otp: otpCode,
  });
  console.log("Step 3:", step3.status); // success

  const verified = await client.transaction.verify(tx.reference);
  console.log("Verified:", verified.status);

  // STEP 7: Mobile Money Payment Flow

  // Initialize a separate transaction for mobile money
  const tx2 = await client.transaction.initialize({
    email: "momo@example.com",
    amount: 5000,
  });

  const momo = await client.charge.mobileMoney({
    accessCode: tx2.accessCode,
    phone: "+233241234567",
    provider: "mtn",
    email: "momo@example.com",
  });

  // Mobile money transactions always return "pending" immediately
  // The final outcome should be handled via webhook
  console.log("\nMoMo status:", momo.transaction.status);

  // STEP 8: Control Panel Operations (Testing/Debugging)

  // Note: Control panel operations use the auth token, not the secret key

  // Update the global scenario, 50% failure rate with 2 second delay
  const scenario = await authClient.control.updateScenario(authToken, {
    failureRate: 0.5,
    delayMs: 2000,
  });
  console.log("\nScenario updated, failure rate:", scenario.failure_rate);

  // Force a specific transaction to fail
  const tx3 = await client.transaction.initialize({
    email: "force@example.com",
    amount: 2000,
  });

  const forced = await authClient.control.forceTransaction(
    authToken,
    tx3.reference,
    {
      status: "failed",
      errorCode: "CHARGE_INSUFFICIENT_FUNDS",
    },
  );
  console.log("Forced status:", forced.status);

  // Reset the scenario back to default
  await authClient.control.resetScenario(authToken);
  console.log("Scenario reset");

  // STEP 9: Retrieve Recent Logs

  try {
    const { logs } = await authClient.control.getLogs(authToken, {
      perPage: 5,
    });
    console.log(`\nRecent requests: ${logs.length}`);
    for (const log of logs) {
      console.log(`  ${log.method} ${log.path} -> ${log.status_code}`);
    }
  } catch (err) {
    if (err instanceof PayfakeError && err.isCode("LOGS_EMPTY")) {
      console.log("\nNo logs found yet (expected for new merchant)");
    } else {
      throw err;
    }
  }
}

// Run the example
main().catch(console.error);
