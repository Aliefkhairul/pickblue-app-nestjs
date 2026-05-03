import { Body, Controller, Get, HttpCode, HttpStatus, Request as NestRequest, Post, Query, Req, Res, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { AuthGuard } from 'utils/https/http.auth.guard'
import { HttpExceptionFilter } from 'utils/https/http.exceptions'
import { getIpAddress, getUserAgent } from 'utils/https/http.headers'
import { HttpResponseInterceptor } from 'utils/https/http.interceptors'
import { setCsrfCookie, setSessionCookie } from 'utils/https/http.sessions.utils'
import { HttpValidationPipe } from 'utils/https/http.validations'
import { AuthenticationService } from './authentication.service'
import { SignInRequest, SignUpRequest } from './dto/authentication.dto'

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

        return {
            message: 'create_user_successfully',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
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

    @Get('account-verification')
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    async accountVerification(@Query('token') token: string, @Query('email') email: string) {
        const user = await this.authenticationService.accountVerification({ token, email })
        return {
            message: 'account_verified_successfully',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
    }

    @Get('me')
    @UseGuards(AuthGuard)
    @UseFilters(HttpExceptionFilter)
    @UseInterceptors(HttpResponseInterceptor)
    @HttpCode(HttpStatus.OK)
    me(@NestRequest() req: Request) {
        const user = req.withUser
        return {
            message: 'get_authenticated_user_successfully',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
    }
}
