import { Body, Controller, Get, HttpCode, HttpStatus, Request as NestRequest, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request, Response } from 'express'
import { AuthGuard } from 'utils/https/auth_guard'
import { getIpAddress, getUserAgent } from 'utils/https/headers'
import { setCsrfCookie, setSessionCookie } from 'utils/https/sessions'
import { HttpValidationPipe } from 'utils/https/validations'
import { AuthenticationService } from './authentication.service'
import { SignInRequest, SignUpRequest } from './dto/authentication.dto'

@Controller('auth')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly configService: ConfigService
    ) {}

    @Post('sign-up')
    @HttpCode(HttpStatus.CREATED)
    async signUp(@Body(new HttpValidationPipe()) dto: SignUpRequest) {
        const user = await this.authenticationService.signUp({
            name: dto.name,
            email: dto.email,
            password: dto.password,
            providerId: dto.provider_id
        })

        return {
            message: 'Sign-Up Successful',
            data: {
                name: user.name,
                email: user.email,
                verified_at: user.verifiedAt
            }
        }
    }

    @Post('sign-in')
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
            message: 'Sign-In Successful',
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
