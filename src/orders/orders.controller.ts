import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { AuthenticatedUserPayload, AuthGuard } from 'utils/https/http.auth.guard'
import { HttpExceptionFilter } from 'utils/https/http.exceptions'
import { HttpResponseInterceptor } from 'utils/https/http.interceptors'
import { PlaceOrderRequestList } from './dto/orders.dto'
import { HttpValidationPipe } from 'utils/https/http.validations'

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post('/place')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async placeOrder(@Req() nestReq: any, @Body(new HttpValidationPipe()) req: PlaceOrderRequestList) {
        const user = nestReq.withUser as AuthenticatedUserPayload

        const { orders, orderItems } = await this.ordersService.placeOrder({
            cartItemIds: req.cart_ids.map(ci => ci.cart_id),
            user: user
        })

        return {
            message: 'place_order_successful',
            data: {
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
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async placeOrderNotification(@Body() req: any) {
        return await this.ordersService.placeOrderNotification(req)
    }
}
