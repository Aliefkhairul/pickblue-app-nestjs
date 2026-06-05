---
name: payments-midtrans
description: "Use when implementing or modifying payment integration with Midtrans Snap or Core API, handling payment webhooks, or processing order payments."
---

# Payments (Midtrans)

## Module Setup

- Global module `PaymentsModule` at `src/payments/payments.module.ts`
- Injection token: `paymentService` = `'PAYMENT_SERVICE_TOKEN'`
- Type: `{ snapApi: midtransClient.Snap, coreApi: midtransClient.CoreApi }`

## Injection

```typescript
import { Inject } from '@nestjs/common'
import { paymentService, type PaymentService } from 'src/payments/payments.module'

@Injectable()
export class SomeService {
  constructor(@Inject(paymentService) private readonly ps: PaymentService) {}
}
```

## Sandbox Configuration

Env vars (already in `.env`):

| Variable                       | Description          |
|-------------------------------|----------------------|
| `MIDTRANS_SANDBOX_MERCHANT_ID` | Merchant ID          |
| `MIDTRANS_SANDBOX_CLIENT_ID`   | Client key (public)  |
| `MIDTRANS_SANDBOX_SERVER_KEY`  | Server key (secret)  |

Both `snapApi` and `coreApi` are initialized with `isProduction: false`.

## Webhook

The module exports a `PaymentGatewayWebhookRequestPayload` type covering the Midtrans webhook shape (transaction status, order_id, gross_amount, fraud_status, signature_key, etc.). Use this type when handling `POST` webhook callbacks.
