import { createClient, PayfakeError } from "../src/index.js";

const client = createClient({
  secretKey: "sk_test_your_key_here",
  baseURL: "http://localhost:8080",
});

async function main() {
  //  Register
  let token;
  try {
    const reg = await client.auth.register({
      businessName: "Acme Store",
      email: "dev@acme.com",
      password: "secret123",
    });
    console.log("Registered:", reg.merchant.id);
    token = reg.token;
  } catch (err) {
    if (
      err instanceof PayfakeError &&
      err.isCode(PayfakeError.CODE_EMAIL_TAKEN)
    ) {
      const login = await client.auth.login({
        email: "dev@acme.com",
        password: "secret123",
      });
      token = login.token;
      console.log("Logged in as:", login.merchant.email);
    } else {
      throw err;
    }
  }

  //  Initialize a transaction
  const tx = await client.transaction.initialize({
    email: "customer@example.com",
    amount: 10000,
    currency: "GHS",
  });
  console.log("\nTransaction initialized");
  console.log("Reference:         ", tx.reference);
  console.log("Access code:       ", tx.accessCode);
  console.log("Authorization URL: ", tx.authorizationUrl);

  //  Charge a card
  try {
    const charge = await client.charge.card({
      accessCode: tx.accessCode,
      cardNumber: "4111111111111111",
      cardExpiry: "12/26",
      cvv: "123",
      email: "customer@example.com",
    });
    console.log("\nCharge status:", charge.transaction.status);
  } catch (err) {
    if (
      err instanceof PayfakeError &&
      err.isCode(PayfakeError.CODE_CHARGE_FAILED)
    ) {
      console.log("\nCharge failed:", err.fields[0]?.message ?? err.code);
    } else {
      throw err;
    }
  }

  //  Verify
  const verified = await client.transaction.verify(tx.reference);
  console.log("Verified status:", verified.status);

  //  MoMo flow
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
  // MoMo always returns pending immediately.
  // Implement a webhook handler for the final outcome.
  console.log("\nMoMo status:", momo.transaction.status); // "pending"

  //  Control panel
  // 50% failure rate + 2 second delay
  const scenario = await client.control.updateScenario(token, {
    failureRate: 0.5,
    delayMs: 2000,
  });
  console.log("\nScenario updated, failure rate:", scenario.failure_rate);

  // Force a specific transaction to fail
  const tx3 = await client.transaction.initialize({
    email: "force@example.com",
    amount: 2000,
  });
  const forced = await client.control.forceTransaction(token, tx3.reference, {
    status: "failed",
    errorCode: "CHARGE_INSUFFICIENT_FUNDS",
  });
  console.log("Forced status:", forced.status);

  // Reset scenario
  await client.control.resetScenario(token);
  console.log("Scenario reset");

  // Recent logs
  const { logs } = await client.control.getLogs(token, { perPage: 5 });
  console.log(`\nRecent requests: ${logs.length}`);
  for (const log of logs) {
    console.log(`  ${log.method} ${log.path} → ${log.status_code}`);
  }
}

main().catch(console.error);
