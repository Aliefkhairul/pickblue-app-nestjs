import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DrizzleQueryError, inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { dbConnection, type PgDatabase } from 'src/database/db_connection'
import { accounts, userRoles, users } from 'src/schema'
import { hashPasswordFn } from 'utils/account'

type SignUpParams = {
    name: string
    email: string
    password: string
    providerId: string
}

@Injectable()
export class AuthenticationService {
    constructor(@Inject(dbConnection) private readonly db: PgDatabase) {}

    async signUp(params: SignUpParams) {
        return await this.db.transaction(async tx => {
            try {
                const [user] = await tx.insert(users).values({ name: params.name, email: params.email }).returning()

                const hashPassword = await hashPasswordFn(params.password)
                await tx.insert(accounts).values({ userId: user.id, providerId: params.providerId, password: hashPassword })

                const role = await tx.query.roles.findMany({
                    where: role => inArray(role.name, ['seller', 'user'])
                })
                if (!role || role.length === 0) {
                    throw new NotFoundException('role_not_found')
                }

                await tx.insert(userRoles).values({ userId: user.id, roleId: role[0].id })
                return user
            } catch (err) {
                if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                    if (err.cause.table === 'users' && err.cause.code === '23505') {
                        throw new ConflictException('email_already_exists')
                    } else if (err.cause.table === 'accounts' && err.cause.code === '23505') {
                        throw new ConflictException('account_already_exists')
                    }
                }
                throw new HttpException({ message: 'database_error' }, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        })
    }
}
