import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthenticatedUserPayload, AuthGuard } from 'utils/https/http_auth_guard'
import { HttpExceptionFilter } from 'utils/https/http_exceptions'
import { HttpResponseInterceptor } from 'utils/https/http_interceptors'
import { HttpValidationPipe } from 'utils/https/http_validations'
import { CreateCartRequest } from './dto/users.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('cart')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async createCart(@Req() req: any, @Body(new HttpValidationPipe()) dto: CreateCartRequest) {
        const user = req.withUser as AuthenticatedUserPayload

        return await this.usersService.createCart({
            userId: user.userId,
            productId: dto.product_id,
            quantity: dto.quantity
        })
    }
}
