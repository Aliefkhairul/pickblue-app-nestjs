/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { startOfMinute } from 'date-fns'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { render } from 'react-email'
import { Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import { PaymentGatewayWebhookRequestPayload, paymentService, type PaymentService } from 'src/payments/payments.module'
import { CartItem, creatorBalances, products, cartItems } from 'src/schema'
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
                orderItems: true
            }
        })

        if (!findOrder) throw new NotFoundException('Order Not Found')

        const emailRender = await render(
            orderConfirmationTemplate({
                orderCode: findOrder.orderCode,
                totalAmount: findOrder.totalAmount,
                createdAt: findOrder.createdAt,
                orderItems: findOrder.orderItems.map(item => ({
                    productNameSnapshot: item.productNameSnapshot,
                    productPriceSnapshot: item.productPriceSnapshot,
                    quantity: item.quantity,
                    subTotal: item.subTotal
                }))
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

        const getExpiresAt = params.expiry_time ? new Date(params.expiry_time.replace(' ', 'T') + 'Z') : null

        this.logger.log({
            message: '[PAYMENT WEBHOOK] Incoming notification',
            orderId,
            transactionStatus,
            transactionId: params.transaction_id,
            expiryTime: params.expiry_time
        })

        const existingOrder = await this.db.query.orders.findFirst({
            where: o => eq(o.id, orderId)
        })

        this.logger.log({
            message: '[PAYMENT WEBHOOK] Order lookup result',
            orderId,
            found: !!existingOrder,
            currentStatus: existingOrder?.status
        })

        if (!existingOrder) {
            this.logger.error({
                message: '[PAYMENT WEBHOOK] Order not found',
                orderId
            })

            throw new NotFoundException('Order Not Found')
        }

        // Prevent duplicate processing
        if (existingOrder.status === 'settled' && (transactionStatus === 'capture' || transactionStatus === 'settlement')) {
            this.logger.warn({
                message: '[PAYMENT WEBHOOK] Order already processed',
                orderId,
                transactionStatus
            })

            return { message: 'Order already processed' }
        }

        // =========================
        // SETTLEMENT / SUCCESS
        // =========================
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            this.logger.log({
                message: '[PAYMENT WEBHOOK] Payment success branch entered',
                orderId,
                transactionStatus
            })

            try {
                return await this.db.transaction(async tx => {
                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Started',
                        orderId
                    })

                    // 1. Update order
                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Updating order status',
                        orderId,
                        newStatus: 'settled'
                    })

                    const updatedOrder = await tx
                        .update(orders)
                        .set({
                            status: 'settled',
                            paidAt: dateUtils.now()
                        })
                        .where(eq(orders.id, orderId))
                        .returning()

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Order updated',
                        orderId,
                        affected: updatedOrder.length,
                        status: updatedOrder[0]?.status
                    })

                    // 2. Update payment
                    const updatedPayment = await tx
                        .update(payments)
                        .set({
                            status: 'settled'
                        })
                        .where(eq(payments.orderId, orderId))
                        .returning()

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Payment updated',
                        orderId,
                        affected: updatedPayment.length
                    })

                    // 3. Get products
                    const orderWithProducts = await tx
                        .select()
                        .from(orders)
                        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
                        .leftJoin(products, eq(orderItems.productId, products.id))
                        .where(eq(orders.id, orderId))

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Order products fetched',
                        orderId,
                        totalItems: orderWithProducts.length,
                        products: orderWithProducts.map(o => ({
                            productId: o.products?.id,
                            productName: o.products?.name
                        }))
                    })

                    if (orderWithProducts.length === 0) {
                        throw new NotFoundException('Order With Product Not Found')
                    }

                    // 4. Increment downloads count
                    for (const o of orderWithProducts) {
                        if (!o.products) {
                            this.logger.warn({
                                message: '[PAYMENT TRANSACTION] Product is null, skipping',
                                orderId
                            })

                            continue
                        }

                        await tx
                            .update(products)
                            .set({
                                downloadsCount: sql`${products.downloadsCount} + 1`
                            })
                            .where(eq(products.id, o.products.id))

                        this.logger.log({
                            message: '[PAYMENT TRANSACTION] Product download count updated',
                            productId: o.products.id
                        })
                    }

                    // 5. Get creator data
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
                        .where(eq(orders.id, orderId))

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Creator data fetched',
                        orderId,
                        totalItems: orderWithCreator.length,
                        data: orderWithCreator
                    })

                    if (orderWithCreator.length === 0) {
                        throw new NotFoundException('Order With Creator Not Found')
                    }

                    // 6. Create user purchases
                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Creating user purchases',
                        orderId,
                        totalPurchases: orderWithCreator.length
                    })

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

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] User purchases created',
                        orderId,
                        totalCreated: createUserPurchases.length
                    })

                    if (createUserPurchases.length === 0) {
                        throw new InternalServerErrorException('Create User Purchases Failed')
                    }

                    // 7. Clear cart
                    const productIds = orderWithCreator.map(o => o.productId).filter((id): id is string => id !== null)

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Clearing cart items',
                        orderId,
                        customerId: orderWithCreator[0].customerId,
                        productIds
                    })

                    if (productIds.length > 0) {
                        await tx
                            .delete(cartItems)
                            .where(and(eq(cartItems.customerId, orderWithCreator[0].customerId), inArray(cartItems.productId, productIds)))
                    }

                    // 8. Creator earnings payload
                    const creatorEarningsPayload = orderWithCreator.reduce((arr: CreateCreatorEarningsPayload[], current) => {
                        if (current.productCreatorId === null || current.productSubTotal === null) {
                            return arr
                        }

                        const creatorId = current.productCreatorId

                        const matchedOwner = arr.find(r => r.creatorId === creatorId)

                        if (!matchedOwner) {
                            arr.push({
                                creatorId,
                                orderId: current.orderId,
                                totalAmount: current.productSubTotal
                            })
                        } else {
                            matchedOwner.totalAmount += current.productSubTotal
                        }

                        return arr
                    }, [])

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Creator earnings calculated',
                        orderId,
                        earnings: creatorEarningsPayload
                    })

                    // 9. Insert creator earnings

                    if (creatorEarningsPayload.length > 0) {
                        const earnings = await tx
                            .insert(creatorEarnings)
                            .values(
                                creatorEarningsPayload.map(cce => {
                                    const payload = {
                                        creatorId: cce.creatorId,
                                        orderId: cce.orderId,
                                        amount: cce.totalAmount,
                                        status: 'settled',
                                        availableAt: startOfMinute(dateUtils.addOneMinutes()),
                                        settledAt: dateUtils.now()
                                    } as NewCreatorEarning

                                    return payload
                                })
                            )
                            .returning()

                        this.logger.log({
                            message: '[PAYMENT TRANSACTION] Creator earnings created',
                            orderId,
                            totalCreated: earnings.length
                        })
                    }

                    // 10. Update creator balances
                    for (const ce of creatorEarningsPayload) {
                        this.logger.log({
                            message: '[PAYMENT TRANSACTION] Updating creator balance',
                            creatorId: ce.creatorId,
                            amount: ce.totalAmount
                        })

                        const [updatedBalance] = await tx
                            .update(creatorBalances)
                            .set({
                                totalEarned: sql`${creatorBalances.totalEarned} + COALESCE(${ce.totalAmount}, 0)`,
                                updatedAt: dateUtils.now()
                            })
                            .where(eq(creatorBalances.creatorId, ce.creatorId))
                            .returning()

                        if (!updatedBalance) {
                            this.logger.warn({
                                message: '[PAYMENT TRANSACTION] Creator balance not found, creating',
                                creatorId: ce.creatorId
                            })

                            await tx.insert(creatorBalances).values({
                                creatorId: ce.creatorId,
                                balance: 0,
                                totalEarned: ce.totalAmount,
                                totalWithdrawn: 0
                            })
                        }
                    }

                    this.logger.log({
                        message: '[PAYMENT TRANSACTION] Completed successfully',
                        orderId
                    })

                    return orderWithCreator
                })
            } catch (error) {
                this.logger.error({
                    message: '[PAYMENT TRANSACTION] FAILED - transaction rolled back',
                    orderId,
                    transactionStatus,
                    error: error instanceof Error ? error.message : error
                })

                throw error
            }
        }

        // =========================
        // CANCEL / EXPIRE
        // =========================
        if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
            this.logger.warn({
                message: '[PAYMENT WEBHOOK] Payment expired/cancelled',
                orderId,
                transactionStatus
            })

            return await this.db.transaction(async tx => {
                await tx.update(orders).set({ status: 'expired' }).where(eq(orders.id, orderId))

                await tx.update(payments).set({ status: 'expired' }).where(eq(payments.orderId, orderId))
            })
        }

        // =========================
        // PENDING
        // =========================
        if (transactionStatus === 'pending') {
            this.logger.log({
                message: '[PAYMENT WEBHOOK] Payment pending',
                orderId,
                transactionId: params.transaction_id
            })

            return await this.db
                .update(payments)
                .set({
                    externalId: params.transaction_id,
                    expiresAt: getExpiresAt
                })
                .where(eq(payments.orderId, orderId))
        }

        this.logger.warn({
            message: '[PAYMENT WEBHOOK] Unknown transaction status',
            orderId,
            transactionStatus
        })
    }
}
