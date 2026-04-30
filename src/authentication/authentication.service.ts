import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { and, DrizzleQueryError, eq, inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { render } from 'react-email'
import { type Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import { accounts, roles, sessions, userRoles, users, verifications } from 'src/schema'
import { comparePasswordFn, generateCsrfToken, generateSessionToken, hashPasswordFn, hashToken } from 'utils/https/http_sessions_utils'
import { emailVerificationTemplate } from 'utils/mail_components/template'
import { generateVerificationToken } from 'utils/random_code'
import { dateUtils } from 'utils/times'

type SignUpParams = {
    name: string
    email: string
    password: string
    providerId: string
}

type SignInParams = {
    email: string
    password: string
    providerId: string
    ipAddress: string
    userAgent: string
}

type AccountVerificationParams = {
    token: string
    email: string
}

type GetAuthenticatedUserParams = {
    sessionToken: string
    csrfToken: string
}

@Injectable()
export class AuthenticationService {
    private readonly logger = new Logger(AuthenticationService.name)

    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(mailService) private readonly resend: Resend,
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
                if (!role || role.length === 0) throw new NotFoundException('role_not_found')

                await tx.insert(userRoles).values(role.map(r => ({ userId: user.id, roleId: r.id })))

                // create verification
                const { token, hashedToken } = generateVerificationToken()
                await tx.insert(verifications).values({
                    userId: user.id,
                    type: 'account_verification',
                    tokenHash: hashedToken,
                    expiresAt: dateUtils.addFifteenMinutes()
                })

                // send email verificiation via resend sdk
                const emailRender = await render(
                    emailVerificationTemplate({
                        redirectUrl: `${this.ConfigService.getOrThrow('APP_URL')}/auth/account-verification?token=${token}&email=${user.email}`
                    })
                )
                const sendEmail = await this.resend.emails.send({
                    from: `Pickblue <verification${this.ConfigService.getOrThrow('APP_MAIL_NAME')}>`,
                    to: user.email,
                    subject: 'Account Verification',
                    html: emailRender
                })
                if (sendEmail.error && sendEmail.error !== null) {
                    throw new HttpException({ message: 'sending_email_fails' }, HttpStatus.INTERNAL_SERVER_ERROR)
                }

                this.logger.log(`User ${user.email} signed up successfully and verification email sent.`)
                return user
            } catch (err) {
                if (err instanceof HttpException) throw err

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

    async signIn(params: SignInParams) {
        return await this.db.transaction(async tx => {
            try {
                // find user
                const user = await tx.query.users.findFirst({ where: user => eq(user.email, params.email) })
                if (!user || user === undefined) throw new NotFoundException('user_not_found')

                // find account
                const account = await tx.query.accounts.findFirst({
                    where: account => {
                        return and(eq(account.userId, user.id), eq(account.providerId, params.providerId))
                    }
                })
                if (!account || account === undefined) throw new NotFoundException('account_not_found')

                // compare password
                const comparePassword = await comparePasswordFn(params.password, account.password)
                if (!comparePassword) throw new BadRequestException('invalid_password')

                // sessions && tokens
                const sessionToken = generateSessionToken()
                const csrfToken = generateCsrfToken()

                await tx.delete(sessions).where(eq(sessions.userId, user.id))
                await tx.insert(sessions).values({
                    token: hashToken(sessionToken),
                    csrfToken: hashToken(csrfToken),
                    userId: user.id,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    expiresAt: dateUtils.addSevenDays()
                })

                return { sessionToken, csrfToken, user }
            } catch (err) {
                if (err instanceof HttpException) throw err
                if (err instanceof NotFoundException || err instanceof BadRequestException) throw err
                throw new HttpException({ message: 'database_error' }, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        })
    }

    async accountVerification(params: AccountVerificationParams) {
        try {
            const verification = await this.db.query.verifications.findFirst({
                where: v => eq(v.tokenHash, hashToken(params.token))
            })
            if (!verification) throw new NotFoundException('verification_not_found')
            if (verification.expiresAt < new Date()) throw new BadRequestException('verification_token_expired')

            const [user] = await this.db.update(users).set({ verifiedAt: new Date() }).where(eq(users.id, verification.userId)).returning()
            return user
        } catch (err) {
            if (err instanceof HttpException) throw err
            if (err instanceof NotFoundException || err instanceof BadRequestException) throw err
            throw new HttpException({ message: 'database_error' }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAuthenticatedUser(params: GetAuthenticatedUserParams) {
        return await this.db.transaction(async tx => {
            try {
                const [user] = await tx
                    .select({
                        sessionId: sessions.id,
                        userId: users.id,
                        name: users.name,
                        email: users.email,
                        verifiedAt: users.verifiedAt
                    })
                    .from(sessions)
                    .leftJoin(users, eq(sessions.userId, users.id))
                    .where(and(eq(sessions.token, hashToken(params.sessionToken)), eq(sessions.csrfToken, hashToken(params.csrfToken))))

                if (!user || user.userId === null || user.name === null || user.email === null) {
                    throw new UnauthorizedException('session_not_found')
                }

                const usrRoles = (await tx
                    .select({
                        name: roles.name
                    })
                    .from(userRoles)
                    .leftJoin(roles, eq(userRoles.roleId, roles.id))
                    .where(eq(userRoles.userId, user.userId as string))) as {
                    name: 'user' | 'seller' | 'admin'
                }[]

                return {
                    sessionId: user.sessionId,
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    verifiedAt: user.verifiedAt,
                    roles: usrRoles.map(r => r.name)
                }
            } catch (error) {
                if (error instanceof HttpException) throw error
                if (error instanceof UnauthorizedException) throw error
                throw new HttpException({ message: 'database_error' }, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        })
    }
}
