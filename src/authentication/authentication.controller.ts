import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters, UseInterceptors } from '@nestjs/common'
import { HttpExceptionFilter } from 'utils/http_exceptions'
import { HttpResponseInterceptor } from 'utils/http_interceptors'
import { AuthenticationService } from './authentication.service'
import { SignUpRequest } from './dto/authentication.dto'

@Controller('auth')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) {}

    @Post('sign-up')
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async signUp(@Body() dto: SignUpRequest) {
        const user = await this.authenticationService.signUp({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            providerId: dto.provider_id
        })

        return { message: 'create_user_successfully', data: user }
    }
}
