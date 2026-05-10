import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { type PaymentGatewayWebhookRequestPayload } from 'src/payments/payments.module'
import { AuthGuard } from 'utils/https/guards'
import { PlaceOrderRequestList } from './dto/orders.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('/place')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async placeOrder(@Req() nestReq: Request, @Body() req: PlaceOrderRequestList) {
        const user = nestReq.withUser

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
