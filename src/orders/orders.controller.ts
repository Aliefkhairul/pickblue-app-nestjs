import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { type PaymentGatewayWebhookRequestPayload } from 'src/payments/payments.module'
import { AuthGuard } from 'utils/https/guards'
import { PlaceOrderRequestList } from './dto/orders.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get('/place/:order_id/success')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async placeSuccessOrder(@Req() req: Request, @Param() param: { order_id: string }) {
        const user = req.withUser
        if (!user) return

        const order = await this.ordersService.placeOrderSuccess({ user: user, orderId: param.order_id })

        return {
            message: 'Get Place Success Order Successful',
            data: {
                id: order.id,
                customer_id: order.customerId,
                order_code: order.orderCode,
                total_amount: order.totalAmount,
                status: order.status,
                paid_at: order.paidAt,
                created_at: order.createdAt,
                updated_at: order.updatedAt,

                order_items: order.orderItems.map(item => ({
                    id: item.id,
                    product_id: item.productId,
                    product_name_snapshot: item.productNameSnapshot,
                    product_description_snapshot: item.productDescriptionSnapshot,
                    product_details_snapshot: item.productDetailsSnapshot,
                    product_price_snapshot: item.productPriceSnapshot,
                    quantity: item.quantity,
                    sub_total: item.subTotal,
                    product_slug: item.product?.slug
                })),

                payment_details: {
                    payment_id: order.payments?.id,
                    external_id: order.payments?.externalId,
                    payment_url: order.payments?.paymentUrl,
                    status: order.payments?.status,
                    provider: order.payments?.provider,
                    expires_at: order.payments?.expiresAt
                }
            }
        }
    }

    @Post('/place')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async placeOrder(@Req() nestReq: Request, @Body() req: PlaceOrderRequestList) {
        const user = nestReq.withUser
        if (!user) return

        const { orders, orderItems, transactionsResponse } = await this.ordersService.placeOrder({
            cartItemIds: req.cart_ids.map(ci => ci.cart_id),
            user: user
        })

        return {
            message: 'Place-Order Successful',
            data: {
                snap_token: transactionsResponse.token,
                redirect_url: transactionsResponse.redirect_url,
                order_id: orders.id,
                order_customer_id: orders.customerId,
                order_code: orders.orderCode,
                total_amount: orders.totalAmount,
                order_items: orderItems.map(orderItem => ({
                    order_item_id: orderItem.id,
                    order_item_name: orderItem.productNameSnapshot,
                    order_item_subtotal: orderItem.subTotal
                }))
            }
        }
    }

    @Post('/place/notification')
    @HttpCode(HttpStatus.CREATED)
    async placeOrderNotification(@Body() req: PaymentGatewayWebhookRequestPayload) {
        return await this.ordersService.placeOrderNotification(req)
    }
}
