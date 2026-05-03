import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthenticationService } from 'src/authentication/authentication.service'

export type AuthenticatedUserPayload = {
    sessionId: string
    userId: string
    name: string
    email: string
    verifiedAt: Date | null
    roles: ('user' | 'seller' | 'admin' | null)[]
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authenticationService: AuthenticationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>()
        const { sessionToken, csrfToken } = this.extractToken(request)

        const payload = await this.authenticationService.getAuthenticatedUser({ sessionToken: sessionToken, csrfToken: csrfToken })
        request.withUser = payload
        return true
    }

    private extractToken(req: Request) {
        const csrfToken = req.headers['x-csrf-token'] as string | undefined
        if (!csrfToken || csrfToken.length < 1 || csrfToken === undefined) throw new UnauthorizedException('csrf_token_not_found')

        const sessionToken = req.cookies['session_token'] as string | undefined
        if (!sessionToken || sessionToken === undefined) throw new UnauthorizedException('session_token_not_found')

        return { csrfToken, sessionToken }
    }
}
