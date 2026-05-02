import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { PaymentGatewayWebhookRequestPayload, type PaymentService, paymentService } from 'src/payments/payments.module'
import { CartItem, products, sellerBalances } from 'src/schema'
import { orderItems, orders } from 'src/schema/orders'
import { payments } from 'src/schema/payments'
import { sellerEarnings } from 'src/schema/seller_earnings'
import { userPurchases } from 'src/schema/user_purchases'
import { AuthenticatedUserPayload } from 'utils/https/http.auth.guard'
import { generateOrderId } from 'utils/random.code'
import { dateUtils } from 'utils/times'

type PlaceOrderParams = {
    cartItemIds: string[]
    user: AuthenticatedUserPayload
}

type statusEnum = ['pending', 'settled', 'expired', 'failed', 'cancelled']

type OrdersPayload = {
    customerId: string
    orderCode: string
    totalAmount: number
    status: statusEnum
    paidAt: Date | null
}

type OrderItemsPayload = {
    orderId: string
    productId: string
    productNameSnapshot: string
    productDescriptionSnapshot: string
    productDetailsSnapshot: string | null
    productPriceSnapshot: number
    quantity: number
    subTotal: number
}

type CreateSellerEarningsPayload = {
    creatorId: string
    orderId: string
    totalAmount: number
}

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    constructor(
        private readonly configService: ConfigService,
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(paymentService) private readonly paymentGateway: PaymentService
    ) {}

    async placeOrder(params: PlaceOrderParams) {
        return await this.db.transaction(async tx => {
            try {
                // find carts
                const userCarts = await tx.query.cartItems.findMany({
                    where: cartItem => inArray(cartItem.id, params.cartItemIds)
                })
                if (userCarts.length === 0) throw new HttpException({ message: 'cart_items_not_found' }, HttpStatus.NOT_FOUND)

                // find products
                const products = await tx.query.products.findMany({
                    where: products =>
                        inArray(
                            products.id,
                            userCarts.map(cart => cart.productId)
                        )
                })
                if (products.length === 0) throw new HttpException({ message: 'products_not_found' }, HttpStatus.NOT_FOUND)

                // is user already bought related product
                const userPurchases = await tx.query.userPurchases.findMany({
                    where: userPurchase =>
                        inArray(
                            userPurchase.productId,
                            products.map(p => p.id)
                        )
                })
                if (userPurchases.length > 0) throw new HttpException({ message: 'products_already_bought' }, HttpStatus.CONFLICT)

                // total amount
                const totalAmount = userCarts.reduce((total: number, current: CartItem) => {
                    const currentProduct = products.find(product => product.id === current.productId)
                    if (!currentProduct) return total

                    return total + currentProduct.price * current.quantity
                }, 0)

                // create orders
                const [createOrders] = await tx
                    .insert(orders)
                    .values({
                        customerId: params.user.userId,
                        orderCode: generateOrderId(),
                        totalAmount: totalAmount,
                        status: 'pending'
                    })
                    .returning()
                if (!createOrders) throw new HttpException({ message: 'create_orders_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)

                // order_items payload
                const orderItemsPayload = userCarts.reduce((arr: OrderItemsPayload[], current: CartItem) => {
                    const currentProduct = products.find(product => product.id === current.productId)
                    if (!currentProduct) return arr

                    arr.push({
                        orderId: createOrders.id,
                        productId: currentProduct.id,
                        productNameSnapshot: currentProduct.name,
                        productDescriptionSnapshot: currentProduct.description,
                        productDetailsSnapshot: currentProduct.details,
                        productPriceSnapshot: currentProduct.price,
                        quantity: current.quantity,
                        subTotal: currentProduct.price * current.quantity
                    })
                    return arr
                }, [])
                if (orderItemsPayload.length === 0) {
                    throw new HttpException({ message: 'create_order_items_payload_fails' }, HttpStatus.NOT_FOUND)
                }

                // create order_items
                const createOrderItems = await tx.insert(orderItems).values(orderItemsPayload).returning()
                if (createOrderItems.length === 0) {
                    throw new HttpException({ message: 'create_order_items_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)
                }

                // insert to midtrans sdk
                const paymentGatewayPayload = {
                    transaction_details: {
                        order_id: createOrders.id,
                        gross_amount: totalAmount
                    },
                    credit_card: {
                        secure: true
                    },
                    customer_details: {
                        email: params.user.email
                    },
                    item_details: orderItemsPayload.map(c => ({
                        id: c.productId,
                        price: c.productPriceSnapshot,
                        quantity: c.quantity,
                        name: c.productNameSnapshot
                    }))
                }
                const transactionsResponse = await this.paymentGateway.snapApi.createTransaction(paymentGatewayPayload)

                // create payment
                const [createPayment] = await tx
                    .insert(payments)
                    .values({
                        orderId: createOrders.id,
                        paymentUrl: transactionsResponse.redirect_url,
                        snapToken: transactionsResponse.token,
                        amount: totalAmount,
                        status: 'pending',
                        provider: this.configService.getOrThrow<string>('APP_PAYMENT_GATEWAY_PROVIDER')
                    })
                    .returning()
                if (!createPayment) throw new HttpException({ message: 'create_payment_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)

                this.logger.debug(transactionsResponse)
                return { orders: createOrders, orderItems: createOrderItems }
            } catch (err) {
                throw err
            }
        })
    }

    async placeOrderNotification(params: PaymentGatewayWebhookRequestPayload) {
        const orderId = params.order_id
        const transactionStatus = params.transaction_status
        const fraudStatus = params.fraud_status
        const getExpiresAt = new Date(params.expiry_time.replace(' ', 'T') + 'Z')

        if (transactionStatus === 'capture') {
            if (fraudStatus == 'challenge') {
            } else if (fraudStatus == 'accept') {
            }
        } else if (transactionStatus == 'settlement') {
            await this.db.transaction(async tx => {
                try {
                    await tx.update(orders).set({ status: 'settled', paidAt: dateUtils.now() }).where(eq(orders.id, orderId))
                    await tx.update(payments).set({ status: 'settled' }).where(eq(payments.orderId, orderId))
                } catch (err) {
                    throw err
                }
            })

            await this.db.transaction(async tx => {
                try {
                    // find order with order_items with user (creator)
                    const orderWithCreator = await tx
                        .select({
                            orderId: orders.id,
                            customerId: orders.customerId,
                            customerOrderId: orders.id,
                            productCreatorId: products.creatorId,
                            productId: products.id,
                            productSubTotal: orderItems.subTotal
                        })
                        .from(orders)
                        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
                        .leftJoin(products, eq(orderItems.productId, products.id))
                        .where(and(eq(orders.id, orderId), eq(orders.status, 'settled')))

                    if (orderWithCreator.length === 0) {
                        throw new HttpException({ message: 'order_with_creator_not_found' }, HttpStatus.NOT_FOUND)
                    }

                    // insert user_purchases
                    const createUserPurchases = await tx
                        .insert(userPurchases)
                        .values(
                            orderWithCreator.map(o => ({
                                customerId: o.customerId,
                                productId: o.productId,
                                orderId: o.customerOrderId
                            }))
                        )
                        .returning()

                    if (createUserPurchases.length === 0) {
                        throw new HttpException({ message: 'create_user_purchases_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)
                    }

                    const sellerEarningsPayload = orderWithCreator.reduce((arr: CreateSellerEarningsPayload[], current) => {
                        if (current.productCreatorId === null || current.productSubTotal === null) return arr
                        const creatorId = current.productCreatorId

                        const matchedOwner = arr.find(r => r.creatorId === creatorId)
                        if (!matchedOwner) {
                            arr.push({ creatorId: current.productCreatorId, orderId: current.orderId, totalAmount: current.productSubTotal })
                        } else matchedOwner.totalAmount += current.productSubTotal

                        return arr
                    }, [])

                    if (sellerEarningsPayload.length === 0) {
                        throw new HttpException({ message: 'create_seller_earnings_payload_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)
                    }

                    // insert seller_earnings
                    const createSellerEarnings = await tx
                        .insert(sellerEarnings)
                        .values(
                            sellerEarningsPayload.map(cse => ({
                                creatorId: cse.creatorId,
                                orderId: cse.orderId,
                                amount: cse.totalAmount,
                                status: 'settled' as 'pending' | 'settled',
                                settledAt: dateUtils.now()
                            }))
                        )
                        .returning()

                    // insert seller_balance
                    const createSellerBalancesPromisesFn = await Promise.all(
                        sellerEarningsPayload.map(async se => {
                            const [createSellerBalances] = await tx
                                .update(sellerBalances)
                                .set({
                                    balance: sql`${sellerBalances.balance} + COALESCE(${se.totalAmount}, 0)`,
                                    totalEarned: sql`${sellerBalances.totalEarned} + COALESCE(${se.totalAmount}, 0)`,
                                    updatedAt: dateUtils.now()
                                })
                                .where(eq(sellerBalances.creatorId, se.creatorId))
                                .returning()

                            if (!createSellerBalances) {
                                throw new HttpException({ message: 'create_seller_balances_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)
                            }
                            return createSellerBalances
                        })
                    )

                    this.logger.debug({ userPurchases: userPurchases })
                    this.logger.debug({ sellerEarnings: createSellerEarnings })
                    this.logger.debug({ sellerBalances: createSellerBalancesPromisesFn })
                } catch (err) {
                    throw err
                }
            })
        } else if (transactionStatus == 'cancel' || transactionStatus == 'expire') {
            await this.db.transaction(async tx => {
                try {
                    await tx.update(orders).set({ status: 'expired' }).where(eq(orders.id, orderId))
                    await tx.update(payments).set({ status: 'expired' }).where(eq(payments.id, orderId))
                } catch (err) {
                    throw err
                }
            })
        } else if (transactionStatus == 'pending') {
            try {
                await this.db
                    .update(payments)
                    .set({
                        externalId: params.transaction_id,
                        expiresAt: getExpiresAt
                    })
                    .where(eq(payments.orderId, orderId))
            } catch (err) {
                throw err
            }
        }
    }
}
