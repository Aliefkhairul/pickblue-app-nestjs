import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard } from 'utils/https/guards'
import { CreateCartRequest } from './dto/users.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('carts')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createCart(@Req() req: Request, @Body() dto: CreateCartRequest) {
        const user = req.withUser

        const userCart = await this.usersService.createCart({
            customerId: user.userId,
            productId: dto.product_id,
            quantity: dto.quantity
        })
        return { message: 'Create Cart Successful', data: userCart }
    }

    @Get('library')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async getLibrary(@Req() req: Request) {
        const user = req.withUser

        const userCart = await this.usersService.getLibrary(user)
        return { message: 'Get Library Data Successul', data: userCart }
    }

    @Get('library-orders')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async getLibraryOrders(@Req() req: Request) {
        const user = req.withUser

        const userCart = await this.usersService.getLibraryOrders(user)
        return { message: 'Get Library Orders Data Successful', data: userCart }
    }
}
