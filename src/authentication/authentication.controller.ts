import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common'
import { HttpExceptionFilter } from 'utils/https/http_exceptions'
import { HttpResponseInterceptor } from 'utils/https/http_interceptors'
import { HttpValidationPipe } from 'utils/https/http_validation.pipe'
import { AuthenticationService } from './authentication.service'
import { SignInRequest, SignUpRequest } from './dto/authentication.dto'
import { getIpAddress, getUserAgent } from 'utils/https/headers'
import type { Request, Response } from 'express'
import { setCsrfCookie, setSessionCookie } from 'utils/https/tokens'
import { ConfigService } from '@nestjs/config'

@Controller('auth')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly configService: ConfigService
    ) {}

    @Post('sign-up')
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.CREATED)
    async signUp(@Body(new HttpValidationPipe()) dto: SignUpRequest) {
        const user = await this.authenticationService.signUp({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            providerId: dto.provider_id
        })

        return { message: 'create_user_successfully', data: user }
    }

    @Post('sign-in')
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    async signIn(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body(new HttpValidationPipe()) dto: SignInRequest) {
        const user = await this.authenticationService.signIn({
            email: dto.email,
            password: dto.password,
            providerId: dto.provider_id,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        })

        setSessionCookie(res, user.sessionToken, this.configService)
        setCsrfCookie(res, user.csrfToken, this.configService)

        return {
            message: 'create_user_successfully',
            data: {
                name: user.user.name,
                email: user.user.email,
                verified_at: user.user.verifiedAt
            }
        }
    }

    @Post('account-verification')
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    async accountVerification(@Req() req: Request, @Res({ passthrough: true }) res: Response) {}
}
