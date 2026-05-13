import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { startOfMinute } from 'date-fns'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { render } from 'react-email'
import { Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import { PaymentGatewayWebhookRequestPayload, paymentService, type PaymentService } from 'src/payments/payments.module'
import { CartItem, creatorBalances, products } from 'src/schema'
import { NewCreatorEarning, creatorEarnings } from 'src/schema/creator_earnings'
import { orderItems, orders } from 'src/schema/orders'
import { payments } from 'src/schema/payments'
import { userPurchases } from 'src/schema/user_purchases'
import { AuthenticatedUserPayload } from 'utils/https/guards'
import { orderConfirmationTemplate } from 'utils/mails/order-confirmation-template'
import { generateOrderId } from 'utils/random.code'
import { dateUtils } from 'utils/times'

type PlaceOrderParams = {
    cartItemIds: string[]
    user: AuthenticatedUserPayload
}

type PlaceOrderSuccessParams = {
    orderId: string
    user: AuthenticatedUserPayload
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

type CreateCreatorEarningsPayload = {
    creatorId: string
    orderId: string
    totalAmount: number
}

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name)

    constructor(
        private readonly configService: ConfigService,
        @Inject(mailService) private readonly resend: Resend,
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(paymentService) private readonly paymentGateway: PaymentService
    ) {}

    async placeOrderSuccess(params: PlaceOrderSuccessParams) {
        const findOrder = await this.db.query.orders.findFirst({
            where: o => eq(o.id, params.orderId),
            with: {
                orderItems: {
                    with: {
                        product: true
                    }
                },
                payments: true
            }
        })

        if (!findOrder) throw new NotFoundException('Order Not Found')

        const emailRender = await render(
            orderConfirmationTemplate({
                id: findOrder.id,
                customerId: findOrder.customerId,
                orderCode: findOrder.orderCode,
                totalAmount: findOrder.totalAmount,
                status: findOrder.status,
                paidAt: findOrder.paidAt,
                createdAt: findOrder.createdAt,
                updatedAt: findOrder.updatedAt,

                orderItems: findOrder.orderItems.map(item => ({
                    id: item.id,
                    productId: item.productId,
                    productNameSnapshot: item.productNameSnapshot,
                    productDescriptionSnapshot: item.productDescriptionSnapshot,
                    productDetailsSnapshot: item.productDetailsSnapshot,
                    productPriceSnapshot: item.productPriceSnapshot,
                    quantity: item.quantity,
                    subTotal: item.subTotal,
                    productSlug: item.product?.slug
                })),

                paymentDetails: {
                    paymentId: findOrder.payments?.id,
                    externalId: findOrder.payments?.externalId,
                    paymentUrl: findOrder.payments?.paymentUrl,
                    status: findOrder.payments?.status,
                    provider: findOrder.payments?.provider,
                    expiresAt: findOrder.payments?.expiresAt
                }
            })
        )

        const sendEmail = await this.resend.emails.send({
            from: `Pickblue <confirmation${this.configService.getOrThrow('APP_MAIL_NAME')}>`,
            to: params.user.email,
            subject: 'Order Confirmation',
            html: emailRender
        })
        if (sendEmail.error !== null) throw new InternalServerErrorException('Sending Email Failed')

        return findOrder
    }

    async placeOrder(params: PlaceOrderParams) {
        return await this.db.transaction(async tx => {
            // find user's carts
            const userCarts = await tx.query.cartItems.findMany({
                where: cartItem => and(eq(cartItem.customerId, params.user.userId), inArray(cartItem.id, params.cartItemIds))
            })
            if (userCarts.length === 0) throw new NotFoundException('User Carts Is Empty')

            // find products
            const products = await tx.query.products.findMany({
                where: products =>
                    inArray(
                        products.id,
                        userCarts.map(cart => cart.productId)
                    )
            })
            if (products.length === 0) throw new NotFoundException('Products Not Found')

            // is user already bought related product
            const userPurchases = await tx.query.userPurchases.findMany({
                where: userPurchase =>
                    and(
                        eq(userPurchase.customerId, params.user.userId),
                        inArray(
                            userPurchase.productId,
                            products.map(p => p.id)
                        )
                    )
            })
            if (userPurchases.length > 0) throw new ConflictException('Products Already Bought')

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
            if (!createOrders) throw new InternalServerErrorException('Create Orders Failed')

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
                throw new InternalServerErrorException('Create Order Items Payload Failed')
            }

            // create order_items
            const createOrderItems = await tx.insert(orderItems).values(orderItemsPayload).returning()
            if (createOrderItems.length === 0) {
                throw new InternalServerErrorException('Create Order Items Failed')
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
            if (!createPayment) throw new InternalServerErrorException('Create Payments Failed')

            this.logger.debug({ transactionResponse: transactionsResponse })
            return { orders: createOrders, orderItems: createOrderItems, transactionsResponse }
        })
    }

    async placeOrderNotification(params: PaymentGatewayWebhookRequestPayload) {
        const orderId = params.order_id
        const transactionStatus = params.transaction_status
        const getExpiresAt = new Date(params.expiry_time.replace(' ', 'T') + 'Z')
        // const fraudStatus = params.fraud_status

        if (transactionStatus === 'capture') {
            /*
            if (fraudStatus == 'challenge') {
            } else if (fraudStatus == 'accept') {
            }
            */
        } else if (transactionStatus == 'settlement') {
            // update order and payment to "setteld" and update products
            await this.db.transaction(async tx => {
                // update orders and payments
                await tx.update(orders).set({ status: 'settled', paidAt: dateUtils.now() }).where(eq(orders.id, orderId))
                await tx.update(payments).set({ status: 'settled' }).where(eq(payments.orderId, orderId))

                const orderWithProducts = await tx
                    .select()
                    .from(orders)
                    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
                    .leftJoin(products, eq(orderItems.productId, products.id))
                    .where(and(eq(orders.id, orderId), eq(orders.status, 'settled')))

                if (orderWithProducts.length === 0) throw new NotFoundException('Order With Product Not Found')

                for (const o of orderWithProducts) {
                    if (!o.products) throw new NotFoundException('Product Not Found')

                    const [updatedProduct] = await tx
                        .update(products)
                        .set({ downloadsCount: sql`${products.downloadsCount} + 1` })
                        .where(eq(products.id, o.products.id))
                        .returning()

                    if (!updatedProduct) throw new InternalServerErrorException('Update Product Failed')
                    return updatedProduct
                }

                // update products
                /* disable promise.all
                await Promise.all(
                    orderWithProducts.map(async o => {
                        if (!o.products) throw new NotFoundException('Product Not Found')

                        const [updatedProduct] = await tx
                            .update(products)
                            .set({ downloadsCount: sql`${products.downloadsCount} + 1` })
                            .where(eq(products.id, o.products.id))
                            .returning()

                        if (!updatedProduct) throw new InternalServerErrorException('Update Product Failed')
                        return updatedProduct
                    })
                )
                */
            })

            return await this.db.transaction(async tx => {
                // find order with order_items with creator
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

                if (orderWithCreator.length === 0) throw new NotFoundException('Order With Creator Not Found')

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
                if (createUserPurchases.length === 0) throw new InternalServerErrorException('Create User Purchases Failed')

                const creatorEarningsPayload = orderWithCreator.reduce((arr: CreateCreatorEarningsPayload[], current) => {
                    if (current.productCreatorId === null || current.productSubTotal === null) return arr
                    const creatorId = current.productCreatorId

                    const matchedOwner = arr.find(r => r.creatorId === creatorId)
                    if (!matchedOwner) {
                        arr.push({ creatorId: current.productCreatorId, orderId: current.orderId, totalAmount: current.productSubTotal })
                    } else matchedOwner.totalAmount += current.productSubTotal

                    return arr
                }, [])

                if (creatorEarningsPayload.length === 0) {
                    throw new InternalServerErrorException('Create Creator Earnings Payload Failed')
                }

                // insert creator_earnings
                await tx
                    .insert(creatorEarnings)
                    .values(
                        creatorEarningsPayload.map(cce => {
                            const payload = {
                                creatorId: cce.creatorId,
                                orderId: cce.orderId,
                                amount: cce.totalAmount,
                                status: 'settled',
                                // availableAt: startOfMinute(dateUtils.addThreeDay()),
                                // TEMPS: nanti klo udah works pake dateutils.addThreeDay()
                                availableAt: startOfMinute(dateUtils.addOneHour()),
                                settledAt: dateUtils.now()
                            } as NewCreatorEarning
                            return payload
                        })
                    )
                    .returning()

                for (const ce of creatorEarningsPayload) {
                    const [createCreatorBalances] = await tx
                        .update(creatorBalances)
                        .set({
                            totalEarned: sql`${creatorBalances.totalEarned} + COALESCE(${ce.totalAmount}, 0)`,
                            updatedAt: dateUtils.now()
                        })
                        .where(eq(creatorBalances.creatorId, ce.creatorId))
                        .returning()

                    if (!createCreatorBalances) {
                        throw new InternalServerErrorException('Create Creator Balances Failed')
                    }
                    return createCreatorBalances
                }

                // update into creator_balancescl
                /* disable promise.all
                const createCreatorBalancesPromisesFn = await Promise.all(
                    creatorEarningsPayload.map(async ce => {
                        const [createCreatorBalances] = await tx
                            .update(creatorBalances)
                            .set({
                                totalEarned: sql`${creatorBalances.totalEarned} + COALESCE(${ce.totalAmount}, 0)`,
                                updatedAt: dateUtils.now()
                            })
                            .where(eq(creatorBalances.creatorId, ce.creatorId))
                            .returning()

                        if (!createCreatorBalances) {
                            throw new InternalServerErrorException('Create Creator Balances Failed')
                        }
                        return createCreatorBalances
                    })
                )
                */

                /* disable logger
                this.logger.debug({ userPurchases: userPurchases })
                this.logger.debug({ creatorEarnings: createCreatorEarnings })
                this.logger.debug({ creatorBalances: createCreatorBalancesPromisesFn })
                */
                return orderWithCreator
            })
        } else if (transactionStatus == 'cancel' || transactionStatus == 'expire') {
            return await this.db.transaction(async tx => {
                const udateOrder = await tx.update(orders).set({ status: 'expired' }).where(eq(orders.id, orderId))
                const udatePayment = await tx.update(payments).set({ status: 'expired' }).where(eq(payments.id, orderId))
                return { udateOrder, udatePayment }
            })
        } else if (transactionStatus == 'pending') {
            return await this.db
                .update(payments)
                .set({
                    externalId: params.transaction_id,
                    expiresAt: getExpiresAt
                })
                .where(eq(payments.orderId, orderId))
        }
    }
}
