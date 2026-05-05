import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { and, DrizzleQueryError, eq, inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { render } from 'react-email'
import { type Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import { accounts, AccountVerificationParams, GetAuthenticatedUserParams, roles, sessions, SignInParams, SignUpParams, userRoles, users, verifications } from 'src/schema'
import { comparePasswordFn, generateCsrfToken, generateSessionToken, hashPasswordFn, hashToken } from 'utils/https/sessions'
import { emailVerificationTemplate } from 'utils/mails/template'
import { generateVerificationToken } from 'utils/random.code'
import { dateUtils } from 'utils/times'

@Injectable()
export class AuthenticationService {
    private readonly logger = new Logger(AuthenticationService.name)

    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(mailService) private readonly resend: Resend,
        private readonly ConfigService: ConfigService
    ) {}

    async signUp(params: SignUpParams) {
        let rawToken: string = ''

        const txUser = await this.db.transaction(async tx => {
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
                if (!role || role.length === 0) throw new NotFoundException('Role Not Seeded')

                await tx.insert(userRoles).values(role.map(r => ({ userId: user.id, roleId: r.id })))

                // create verification
                const { token, hashedToken } = generateVerificationToken()
                rawToken = token
                await tx.insert(verifications).values({
                    userId: user.id,
                    type: 'account_verification',
                    tokenHash: hashedToken,
                    expiresAt: dateUtils.addFifteenMinutes()
                })

                return user
            } catch (err) {
                if (err instanceof DrizzleQueryError && err.cause instanceof DatabaseError) {
                    if (err.cause.table === 'users' && err.cause.code === '23505') {
                        throw new ConflictException('Email Already Exists')
                    } else if (err.cause.table === 'accounts' && err.cause.code === '23505') {
                        throw new ConflictException('Account Already Exists')
                    }
                }

                throw err
            }
        })

        // send email verification via resend sdk
        const emailRender = await render(
            emailVerificationTemplate({
                redirectUrl: `${this.ConfigService.getOrThrow('APP_URL')}/auth/account-verification?token=${rawToken}&email=${txUser.email}`
            })
        )
        const sendEmail = await this.resend.emails.send({
            from: `Pickblue <verification${this.ConfigService.getOrThrow('APP_MAIL_NAME')}>`,
            to: txUser.email,
            subject: 'Account Verification',
            html: emailRender
        })
        if (sendEmail.error && sendEmail.error !== null) {
            throw new InternalServerErrorException('Sending Email Failed')
        }

        return txUser
    }

    async signIn(params: SignInParams) {
        return await this.db.transaction(async tx => {
            // find user
            const user = await tx.query.users.findFirst({ where: user => eq(user.email, params.email) })
            if (!user || user === undefined) throw new NotFoundException('User Not Found')

            // find account
            const account = await tx.query.accounts.findFirst({
                where: account => {
                    return and(eq(account.userId, user.id), eq(account.providerId, params.providerId))
                }
            })
            if (!account || account === undefined) throw new NotFoundException('Account Not Found')

            // compare password
            const comparePassword = await comparePasswordFn(params.password, account.password)
            if (!comparePassword) throw new UnauthorizedException('Invalid Password')

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
        })
    }

    async accountVerification(params: AccountVerificationParams) {
        const verification = await this.db.query.verifications.findFirst({
            where: v => eq(v.tokenHash, hashToken(params.token))
        })
        if (!verification) throw new NotFoundException('Verification Not Found')
        if (verification.expiresAt < new Date()) throw new UnauthorizedException('Verification Token Expired')

        const [user] = await this.db.update(users).set({ verifiedAt: new Date() }).where(eq(users.id, verification.userId)).returning()
        return user
    }

    async getAuthenticatedUser(params: GetAuthenticatedUserParams) {
        return await this.db.transaction(async tx => {
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
                throw new UnauthorizedException('Session Not Found')
            }

            const usrRoles = await tx
                .select({
                    name: roles.name
                })
                .from(userRoles)
                .leftJoin(roles, eq(userRoles.roleId, roles.id))
                .where(eq(userRoles.userId, user.userId))

            return {
                sessionId: user.sessionId,
                userId: user.userId,
                name: user.name,
                email: user.email,
                verifiedAt: user.verifiedAt,
                roles: usrRoles.map(r => r.name)
            }
        })
    }
}
