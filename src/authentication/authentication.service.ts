import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DrizzleQueryError, inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { type Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
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
    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(mailService) private readonly mailsService: Resend,
        private readonly ConfigService: ConfigService
    ) {}

    async signUp(params: SignUpParams) {
        return await this.db.transaction(async tx => {
            try {
                // insert user
                const [user] = await tx.insert(users).values({ name: params.name, email: params.email }).returning()

                // insert account
                const hashPassword = await hashPasswordFn(params.password)
                await tx.insert(accounts).values({ userId: user.id, providerId: params.providerId, password: hashPassword })

                // set role
                const role = await tx.query.roles.findMany({
                    where: role => inArray(role.name, ['seller', 'user'])
                })
                if (!role || role.length === 0) {
                    throw new NotFoundException('role_not_found')
                }
                await tx.insert(userRoles).values({ userId: user.id, roleId: role[0].id })

                const from = `Pickblue <${this.ConfigService.getOrThrow<string>('APP_MAIL_NAME')}>`

                // send email verificiation via resend sdk
                const sendEmail = await this.mailsService.emails.send({
                    from: from,
                    to: user.email,
                    subject: 'Account Verification',
                    html: '<strong>It works!</strong>'
                })
                console.log({ sendEmail })

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
