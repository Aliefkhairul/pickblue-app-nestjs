import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthenticatedUserPayload } from './http_auth_guard'

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
