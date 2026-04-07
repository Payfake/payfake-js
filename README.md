# payfake-js

Official JavaScript SDK for [Payfake API](https://github.com/payfake/payfake-api) — a self-hostable African payment simulator that mirrors the Paystack API exactly. Test every payment scenario without touching real money.

## Installation

```bash
npm install payfake-js
```

## Quick Start

```js
import { createClient, PayfakeError } from "payfake-js"

const client = createClient({
  secretKey: "sk_test_xxx",
  baseURL:   "http://localhost:8080", // your Payfake server
})

// Initialize a transaction
const tx = await client.transaction.initialize({
  email:    "customer@example.com",
  amount:   10000, // GHS 100.00 — amounts in smallest unit (pesewas)
  currency: "GHS",
})

console.log("Access code:", tx.accessCode)
console.log("Auth URL:",    tx.authorizationUrl)

// Charge a card
try {
  const charge = await client.charge.card({
    accessCode:  tx.accessCode,
    cardNumber:  "4111111111111111",
    cardExpiry:  "12/26",
    cvv:         "123",
    email:       "customer@example.com",
  })
  console.log("Status:", charge.transaction.status)
} catch (err) {
  if (err instanceof PayfakeError && err.isCode(PayfakeError.CODE_CHARGE_FAILED)) {
    console.log("Charge failed:", err.code)
  } else {
    throw err
  }
}

// Verify the transaction
const verified = await client.transaction.verify(tx.reference)
console.log("Verified:", verified.status)
```

## Namespaces

| Namespace | Access | Description |
|-----------|--------|-------------|
| `client.auth` | Public + JWT | Register, login, key management |
| `client.transaction` | Secret key | Initialize, verify, list, refund |
| `client.charge` | Secret key | Card, mobile money, bank transfer |
| `client.customer` | Secret key | Create, list, fetch, update |
| `client.control` | JWT | Scenarios, webhooks, logs, force outcomes |

## Error Handling

Every failed API call throws `PayfakeError`. Use `isCode()` for programmatic handling:

```js
try {
  await client.transaction.initialize(input)
} catch (err) {
  if (err instanceof PayfakeError) {
    switch (err.code) {
      case PayfakeError.CODE_REFERENCE_TAKEN:
        // duplicate reference, verify the existing transaction instead
        break
      case PayfakeError.CODE_INVALID_AMOUNT:
        // amount is zero or negative
        break
      default:
        throw err
    }
  }
}
```

Available error code constants:

```js
PayfakeError.CODE_EMAIL_TAKEN
PayfakeError.CODE_INVALID_CREDENTIALS
PayfakeError.CODE_UNAUTHORIZED
PayfakeError.CODE_TOKEN_EXPIRED
PayfakeError.CODE_TRANSACTION_NOT_FOUND
PayfakeError.CODE_REFERENCE_TAKEN
PayfakeError.CODE_INVALID_AMOUNT
PayfakeError.CODE_CHARGE_FAILED
PayfakeError.CODE_CHARGE_PENDING
PayfakeError.CODE_CUSTOMER_NOT_FOUND
PayfakeError.CODE_CUSTOMER_EMAIL_TAKEN
PayfakeError.CODE_VALIDATION_ERROR
PayfakeError.CODE_INTERNAL_ERROR
```

## Scenario Control

```js
// Login first to get a JWT
const { token } = await client.auth.login({
  email:    "dev@acme.com",
  password: "secret123",
})

// 30% failure rate with 1 second delay
await client.control.updateScenario(token, {
  failureRate: 0.3,
  delayMs:     1000,
})

// Force a specific transaction to fail
await client.control.forceTransaction(token, reference, {
  status:    "failed",
  errorCode: "CHARGE_INSUFFICIENT_FUNDS",
})

// Reset everything back to defaults
await client.control.resetScenario(token)
```

## Mobile Money

MoMo charges are async, always return `pending` immediately.
The final outcome arrives via webhook after the simulated delay:

```js
const charge = await client.charge.mobileMoney({
  accessCode: tx.accessCode,
  phone:      "+233241234567",
  provider:   "mtn", // mtn | vodafone | airteltigo
  email:      "customer@example.com",
})

// charge.transaction.status is always "pending" here
// implement a webhook handler for the final outcome
```

## camelCase API

The SDK converts between camelCase (JS) and snake_case (API) automatically.
You always write idiomatic JavaScript, the SDK handles the translation:

```js
// You write:
client.charge.card({ accessCode, cardNumber, cardExpiry })

// SDK sends:
{ "access_code": "...", "card_number": "...", "card_expiry": "..." }
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- A running [Payfake API](https://github.com/payfake/payfake-api) server

## Browser Support

Works in all modern browsers that support the native `fetch` API.
No bundler configuration required.

## License

MIT
