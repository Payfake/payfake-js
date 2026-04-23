# payfake-js

Official JavaScript SDK for [Payfake](https://payfake.co) — a Paystack-compatible payment
simulator for African developers.

```bash
npm install payfake-js
```

---

## Quick Start

```js
import { createClient } from "payfake-js"

const client = createClient({
  secretKey: "sk_test_xxx",
  baseURL:   "https://api.payfake.co",  // or "http://localhost:8080" for self-hosted
})
```

Change one env var to switch between Payfake and real Paystack:

```bash
# Development
PAYSTACK_BASE_URL=https://api.payfake.co
PAYSTACK_SECRET_KEY=sk_test_xxx

# Production
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_SECRET_KEY=sk_live_xxx
```

---

## Full Card Flow

```js
// Initialize
const tx = await client.transaction.initialize({
  email:    "customer@example.com",
  amount:   10000,
  currency: "GHS",
})

// Charge — local Verve card
const step1 = await client.charge.card({
  email:      "customer@example.com",
  accessCode: tx.access_code,
  card: {
    number:      "5061000000000000",
    cvv:         "123",
    expiryMonth: "12",
    expiryYear:  "2026",
  },
})
// step1.status === "send_pin"

// Submit PIN
const step2 = await client.charge.submitPIN({ reference: tx.reference, pin: "1234" })
// step2.status === "send_otp"

// Get OTP from logs (no real phone needed)
const logs = await client.control.getOTPLogs(token, tx.reference)
const otp  = logs[0]?.otp_code

// Submit OTP
const step3 = await client.charge.submitOTP({ reference: tx.reference, otp })
// step3.status === "success"

// Verify
const verified = await client.transaction.verify(tx.reference)
// verified.status === "success"
// verified.gateway_response === "Approved"
```

---

## Charge Flow Status Reference

| Status | Meaning | Next Call |
|--------|---------|-----------|
| `send_pin` | Enter card PIN | `charge.submitPIN` |
| `send_otp` | Enter OTP | `charge.submitOTP` |
| `send_birthday` | Enter date of birth | `charge.submitBirthday` |
| `send_address` | Enter billing address | `charge.submitAddress` |
| `open_url` | Complete 3DS — open `url` field | Navigate checkout to `url` |
| `pay_offline` | Approve USSD prompt | Poll `transaction.publicVerify` |
| `success` | Payment complete | Call `transaction.verify` |
| `failed` | Payment declined | Read `gateway_response` |

---

## Mobile Money

```js
const step1 = await client.charge.mobileMoney({
  email:       "customer@example.com",
  accessCode:  tx.access_code,
  mobileMoney: { phone: "+233241234567", provider: "mtn" },
})
// step1.status === "send_otp"

const logs  = await client.control.getOTPLogs(token, tx.reference)
const step2 = await client.charge.submitOTP({ reference: tx.reference, otp: logs[0].otp_code })
// step2.status === "pay_offline"

// Poll every 3 seconds
const poll = setInterval(async () => {
  const result = await client.transaction.publicVerify(tx.reference)
  if (result.status === "success" || result.status === "failed") {
    clearInterval(poll)
  }
}, 3000)
```

---

## Scenario Testing

```js
// Login to get JWT
const { access_token: token } = await client.auth.login({
  email:    "dev@acme.com",
  password: "secret123",
})

// Force failure
await client.control.updateScenario(token, {
  forceStatus: "failed",
  errorCode:   "CHARGE_INSUFFICIENT_FUNDS",
})

// Reset
await client.control.resetScenario(token)
```

---

## Error Handling

```js
import { createClient, PayfakeError } from "payfake-js"

try {
  await client.charge.submitOTP({ reference, otp: "000000" })
} catch (err) {
  if (err instanceof PayfakeError) {
    if (err.isCode(PayfakeError.CODE_INVALID_OTP)) {
      // OTP wrong or expired
      await client.charge.resendOTP({ reference })
    } else {
      console.log(err.code, err.message, err.httpStatus)
      // Field-level errors (validation failures)
      err.fields.forEach(f => console.log(f.field, f.rule, f.message))
    }
  }
}
```

---

## Webhook Verification

```js
import { createHmac } from "crypto"

function verifyWebhook(rawBody, signature, secretKey) {
  const expected = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex")
  return expected === signature
}

// Express — use express.raw() not express.json() for the webhook route
app.post("/webhook/paystack", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-paystack-signature"]
  if (!verifyWebhook(req.body, sig, process.env.PAYSTACK_SECRET_KEY)) {
    return res.sendStatus(401)
  }
  const event = JSON.parse(req.body)
  if (event.event === "charge.success") { /* update order */ }
  res.sendStatus(200)
})
```

---

## License

MIT
