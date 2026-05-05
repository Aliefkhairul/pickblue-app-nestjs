import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

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
        if (!requiredRoles) return true

        const request = context.switchToHttp().getRequest<Request>()
        return requiredRoles.some(role => request.withUser?.roles.includes(role))
    }
}
