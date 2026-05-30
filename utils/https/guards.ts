import { CanActivate, ExecutionContext, Injectable, Logger, SetMetadata, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { AuthenticationService } from 'src/authentication/authentication.service'

/**
 * AUTH GUARDS
 */
export type AuthenticatedUserPayload = {
    sessionId: string
    userId: string
    name: string
    email: string
    verifiedAt: Date | null
    roles: ('user' | 'creator' | 'admin' | null)[]
}

export const AuthGuardsIsOptional = () => SetMetadata('optional', true)

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name)

    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isOptional = this.reflector.get<boolean>('optional', context.getHandler())
        const request = context.switchToHttp().getRequest<Request>()
        const sessionToken = this.extractToken(request)

        if (isOptional) return true

        const payload = await this.authenticationService.getAuthenticatedUser({ sessionToken })
        request.withUser = payload

        return true
    }

    private extractToken(req: Request) {
        const sessionToken = req.cookies['pickbluesession'] as string | undefined

        if (!sessionToken || sessionToken === undefined) {
            throw new UnauthorizedException('Session Token Not Found :))')
        }

        return sessionToken
    }
}

/**
 * ROLES GUARDS
 */
export enum Role {
    Creator = 'creator',
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
        if (!requiredRoles) return true

        const request = context.switchToHttp().getRequest<Request>()

        const currentUser = request.withUser
        if (currentUser === undefined) return false

        return requiredRoles.some(role => currentUser.roles.includes(role))
    }
}
