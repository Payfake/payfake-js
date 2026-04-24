import { createClient, PayfakeError } from "../src/index.js";

const client = createClient({
  secretKey: "sk_test_your_key_here",
  baseURL: "http://localhost:8080",
});

//  Register
let token;
try {
  const resp = await client.auth.register({
    business_name: "Acme Store",
    email: "dev@acme.com",
    password: "secret123",
  });
  token = resp.access_token;
  console.log("Registered:", resp.merchant.id);
} catch (err) {
  if (
    err instanceof PayfakeError &&
    err.isCode(PayfakeError.CODE_EMAIL_TAKEN)
  ) {
    console.log("Email taken — logging in");
    const resp = await client.auth.login({
      email: "dev@acme.com",
      password: "secret123",
    });
    token = resp.access_token;
  } else {
    throw err;
  }
}

//  Get keys and reconfigure client
const keys = await client.auth.getKeys(token);
console.log("Secret key:", keys.secret_key.slice(0, 20) + "...");

const authedClient = createClient({
  secretKey: keys.secret_key,
  baseURL: "http://localhost:8080",
});

//  Initialize a transaction
const tx = await authedClient.transaction.initialize({
  email: "customer@example.com",
  amount: 10000,
  currency: "GHS",
});
console.log("\nReference:        ", tx.reference);
console.log("Authorization URL:", tx.authorization_url);

//  Full local Verve card flow
console.log("\n Card flow (local Verve) ");

// Step 1: Initiate
// 5061xxxxxxxxxxxxxxxx = local Ghana Verve card → send_pin
// 4111xxxxxxxxxxxx     = international Visa       → open_url (3DS)
const step1 = await authedClient.charge.card({
  email: "customer@example.com",
  reference: tx.reference,
  card: {
    number: "5061000000000000",
    cvv: "123",
    expiryMonth: "12",
    expiryYear: "2026",
  },
});
console.log("Step 1:", step1.status); // send_pin

// Step 2: Submit PIN
const step2 = await authedClient.charge.submitPIN({
  reference: tx.reference,
  pin: "1234",
});
console.log("Step 2:", step2.status); // send_otp

// Step 3: Get OTP from logs, no real phone needed
const otpLogs = await authedClient.control.getOTPLogs(token, tx.reference);
const otp = otpLogs[0]?.otp_code;
console.log("OTP:   ", otp);

// Step 4: Submit OTP
const step3 = await authedClient.charge.submitOTP({
  reference: tx.reference,
  otp,
});
console.log("Step 3:", step3.status); // success

//  Verify
const verified = await authedClient.transaction.verify(tx.reference);
console.log("\nVerified:         ", verified.status);
console.log("Gateway response: ", verified.gateway_response);
console.log("Auth code:        ", verified.authorization?.authorization_code);

//  MoMo flow
console.log("\n MoMo flow ");

const tx2 = await authedClient.transaction.initialize({
  email: "momo@example.com",
  amount: 5000,
});

const momo1 = await authedClient.charge.mobileMoney({
  email: "momo@example.com",
  reference: tx2.reference,
  mobileMoney: { phone: "+233241234567", provider: "mtn" },
});
console.log("MoMo step 1:", momo1.status); // send_otp

const momoOTPs = await authedClient.control.getOTPLogs(token, tx2.reference);
const momo2 = await authedClient.charge.submitOTP({
  reference: tx2.reference,
  otp: momoOTPs[0]?.otp_code,
});
console.log("MoMo step 2:", momo2.status); // pay_offline

// Poll until resolved
console.log("Polling for resolution...");
for (let i = 0; i < 10; i++) {
  const result = await authedClient.transaction.publicVerify(
    tx2.reference,
    tx2.access_code,
  );
  console.log(
    `  poll ${i + 1}: status=${result.status} flow=${result.charge?.flow_status ?? "–"}`,
  );
  if (result.status === "success" || result.status === "failed") {
    console.log("Resolved:", result.status);
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}

//  Scenario testing
console.log("\n Scenario testing ");

await authedClient.control.updateScenario(token, {
  forceStatus: "failed",
  errorCode: "CHARGE_INSUFFICIENT_FUNDS",
});
console.log("Scenario: force insufficient funds");

const tx3 = await authedClient.transaction.initialize({
  email: "fail@example.com",
  amount: 10000,
});
try {
  await authedClient.charge.card({
    email: "fail@example.com",
    reference: tx3.reference,
    card: {
      number: "5061000000000000",
      cvv: "123",
      expiryMonth: "12",
      expiryYear: "2026",
    },
  });
} catch (err) {
  console.log("Charge failed as expected:", err.code);
  if (
    err instanceof PayfakeError &&
    err.isCode(PayfakeError.CODE_INSUFFICIENT_FUNDS)
  ) {
    console.log("Correctly identified as insufficient funds");
  }
}

await authedClient.control.resetScenario(token);
console.log("Scenario reset");

//  Stats
const stats = await authedClient.control.getStats(token);
console.log(
  `\nStats: total=${stats.transactions.total} success_rate=${stats.transactions.success_rate.toFixed(1)}%`,
);
