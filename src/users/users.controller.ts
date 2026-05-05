import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from 'utils/https/auth_guard'
import { HttpValidationPipe } from 'utils/https/validations'
import { CreateCartRequest } from './dto/users.dto'
import { UsersService } from './users.service'
import type { Request } from 'express'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('carts')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createCart(@Req() req: Request, @Body(new HttpValidationPipe()) dto: CreateCartRequest) {
        const user = req.withUser

        const userCart = await this.usersService.createCart({
            customerId: user.userId,
            productId: dto.product_id,
            quantity: dto.quantity
        })
        return { message: 'create_cart_successful', data: userCart }
    }
}
