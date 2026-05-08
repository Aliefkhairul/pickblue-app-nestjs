import { Body, Controller, Get, HttpCode, HttpStatus, Request as NestRequest, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { AuthGuard } from 'utils/https/guards'
import { getIpAddress, getUserAgent } from 'utils/https/headers'
import { setSessionCookie } from 'utils/https/sessions'
import { AuthenticationService } from './authentication.service'
import { LoginRequest, RegisterRequest, RegisterUserRequest } from './dto/authentication.dto'

@Controller('auth')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly configService: ConfigService
    ) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterRequest) {
        const data = await this.authenticationService.register({ email: dto.email })
        return { message: 'Register Successful', data }
    }

    @Post('register-user')
    @HttpCode(HttpStatus.CREATED)
    async registerUser(@Body() dto: RegisterUserRequest) {
        const user = await this.authenticationService.registerUser({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            role: dto.role as 'user' | 'creator',
            token: dto.token,
            providerId: dto.provider_id
        })

        return {
            message: 'Register User Successful',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: LoginRequest) {
        const user = await this.authenticationService.login({
            email: dto.email,
            password: dto.password,
            providerId: dto.provider_id,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        })

        setSessionCookie(res, user.sessionToken, this.configService)

        return {
            message: 'Login Successful',
            data: {
                name: user.user.name,
                email: user.user.email,
                verified_at: user.user.verifiedAt
            }
        }
    }

    @Get('account-verification')
    @HttpCode(HttpStatus.OK)
    async accountVerification(@Query('token') token: string, @Query('email') email: string) {
        const user = await this.authenticationService.accountVerification({ token, email })
        return {
            message: 'Account-Verification Successful',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
    }

    @Get('me')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    me(@NestRequest() req: Request) {
        const user = req.withUser
        return {
            message: 'Get-Authenticated-User Successful',
            data: {
                name: user.name,
                email: user.email,
                roles: user.roles,
                verified_at: user.verifiedAt
            }
        }
    }
}
