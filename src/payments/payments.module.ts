import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import midtransClient from 'midtrans-client'

export const paymentService = 'PAYMENT_SERVICE_TOKEN'

export type PaymentService = {
    snapApi: midtransClient.Snap
    coreApi: midtransClient.CoreApi
    irisCreatorApi: any
    irisApproverApi: any
}

export type PaymentGatewayWebhookRequestPayload = {
    transaction_type: string
    transaction_time: string
    transaction_status: 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure' | 'capture'
    transaction_id: string
    status_message: string
    status_code: string
    signature_key: string
    settlement_time: string
    pop_id: string
    payment_type: string
    order_id: string
    merchant_id: string
    merchant_cross_reference_id: string
    issuer: string
    gross_amount: string
    fraud_status: 'accept' | 'challenge' | 'deny'
    expiry_time: string
    customer_details: {
        email: string
    }
    currency: string
    acquirer: string
}

@Global()
@Module({
    providers: [
        {
            provide: paymentService,
            inject: [ConfigService],
            useFactory: function (c: ConfigService) {
                const snapApi = new midtransClient.Snap({
                    isProduction: false,
                    serverKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_SERVER_KEY'),
                    clientKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_CLIENT_ID')
                })
                console.log('Midtrans snapApi has initialize')

                const coreApi = new midtransClient.CoreApi({
                    isProduction: false,
                    serverKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_SERVER_KEY'),
                    clientKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_CLIENT_ID')
                })
                console.log('Midtrans coreApi has initialize')

                const irisCreatorApi = new (midtransClient as any).Iris({
                    isProduction: false,
                    serverKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_DISBURSEMENT_CREATOR_SERVER_KEY')
                })
                console.log('Midtrans iris Creator has initialize')

                const irisApproverApi = new (midtransClient as any).Iris({
                    isProduction: false,
                    serverKey: c.getOrThrow<string>('MIDTRANS_SANDBOX_DISBURSEMENT_APPROVER_SERVER_KEY')
                })
                console.log('Midtrans iris Approver has initialize')

                return { snapApi, coreApi, irisCreatorApi, irisApproverApi }
            }
        }
    ],
    exports: [paymentService]
})
export class PaymentsModule {}
