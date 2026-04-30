import { CanActivate, ExecutionContext, Injectable, Logger, SetMetadata, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
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
    private readonly logger = new Logger()
    constructor(private readonly authenticationService: AuthenticationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        try {
            const { sessionToken, csrfToken } = await this.extractToken(request)
            const payload = await this.authenticationService.getAuthenticatedUser({ sessionToken: sessionToken, csrfToken: csrfToken })

            this.logger.log(`Authenticated user: ${payload.userId} (${payload.email})`)
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

export enum Role {
    Seller = 'seller',
    User = 'user',
    Admin = 'admin'
}

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()])
        if (!requiredRoles) {
            return true
        }
        const { withUser } = context.switchToHttp().getRequest() as { withUser: AuthenticatedUserPayload | undefined }
        return requiredRoles.some(role => withUser?.roles.includes(role))
    }
}
