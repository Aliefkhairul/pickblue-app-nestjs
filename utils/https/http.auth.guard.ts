import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { AuthenticationService } from 'src/authentication/authentication.service'

export type AuthenticatedUserPayload = {
    sessionId: string
    userId: string
    name: string
    email: string
    verifiedAt: Date | null
    roles: string[]
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authenticationService: AuthenticationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        try {
            const { sessionToken, csrfToken } = await this.extractToken(request)
            const payload = await this.authenticationService.getAuthenticatedUser({ sessionToken: sessionToken, csrfToken: csrfToken })
            request['withUser'] = payload
        } catch (err) {
            throw err
        }
        return true
    }

    async extractToken(req: Request) {
        try {
            const csrfToken = req.headers['x-csrf-token'] as string | undefined
            if (!csrfToken || csrfToken.length < 1 || csrfToken === undefined) throw new UnauthorizedException('csrf_token_not_found')

            const sessionToken = req.cookies['session_token'] as string | undefined
            if (!sessionToken || sessionToken === undefined) throw new UnauthorizedException('session_token_not_found')

            return { csrfToken, sessionToken }
        } catch (err) {
            throw err
        }
    }
}
