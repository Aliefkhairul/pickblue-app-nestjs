import { ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { and, DrizzleQueryError, eq, lt } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { render } from 'react-email'
import { type Resend } from 'resend'
import { dbConnection, type PgDB } from 'src/database/database.module'
import { mailService } from 'src/mails/mails.module'
import {
    accounts,
    AccountVerificationParams,
    creatorBalances,
    GetAuthenticatedUserParams,
    LoginParams,
    RegisterUserParams,
    roles,
    sessions,
    userRoles,
    users,
    verifications
} from 'src/schema'
import { AuthenticatedUserPayload } from 'utils/https/guards'
import { comparePasswordFn, generateSessionToken, hashPasswordFn, hashToken } from 'utils/https/sessions'
import { emailVerificationTemplate } from 'utils/mails/email-verification-template'
import { generateVerificationToken } from 'utils/random.code'
import { dateUtils } from 'utils/times'

type RegisterSchema = {
    email: string
}

type LogoutParams = {
    user: AuthenticatedUserPayload
}

type ProfileParams = {
    user: AuthenticatedUserPayload
}

@Injectable()
export class AuthenticationService {
    private readonly logger = new Logger(AuthenticationService.name)

    constructor(
        @Inject(dbConnection) private readonly db: PgDB,
        @Inject(mailService) private readonly resend: Resend,
        private readonly ConfigService: ConfigService
    ) {}

    async register(params: RegisterSchema) {
        const user = await this.db.query.users.findFirst({ where: u => eq(u.email, params.email) })
        if (user !== undefined) throw new ConflictException('User Already Exists')

        const { token, hashedToken } = generateVerificationToken()

        await this.db.insert(verifications).values({
            type: 'register_verification',
            tokenHash: hashedToken,
            expiresAt: dateUtils.addFifteenMinutes()
        })

        const emailRender = await render(
            emailVerificationTemplate({
                redirectUrl: `${this.ConfigService.getOrThrow('APP_FE_URL')}/register-user?email=${params.email}&token=${token}`
            })
        )

        const sendEmail = await this.resend.emails.send({
            from: `Pickblue <verification${this.ConfigService.getOrThrow('APP_MAIL_NAME')}>`,
            to: params.email,
            subject: 'Account Verification',
            html: emailRender
        })
        if (sendEmail.error !== null) throw new InternalServerErrorException('Sending Email Failed')

        return { email: params.email }
    }

    async registerUser(params: RegisterUserParams) {
        return await this.db.transaction(async tx => {
            try {
                // find verification token
                const verification = await tx.query.verifications.findFirst({
                    where: v => and(eq(v.tokenHash, hashToken(params.token)), eq(v.type, 'register_verification'))
                })
                if (verification === undefined) throw new NotFoundException('Register Verification Not Found')

                // BUGS: RE-SEND VERIFICATION
                if (verification.expiresAt < new Date()) {
                    throw new UnauthorizedException('Verification Token Expired')
                }

                // insert user
                const [user] = await tx.insert(users).values({ name: params.name, email: params.email, verifiedAt: dateUtils.now() }).returning()

                // insert account
                const hashPassword = await hashPasswordFn(params.password)
                await tx.insert(accounts).values({ userId: user.id, accountId: user.id, providerId: params.providerId, password: hashPassword })

                // set role
                if (params.role === 'creator') {
                    const role = await tx.query.roles.findFirst({ where: r => eq(r.name, 'creator') })
                    if (role === undefined) throw new NotFoundException('Role Not Seeded')

                    await tx.insert(userRoles).values({ roleId: role.id, userId: user.id }).returning()
                    await tx.insert(creatorBalances).values({ creatorId: user.id, balance: 0, totalEarned: 0, totalWithdrawn: 0 }).returning()
                } else {
                    const role = await tx.query.roles.findFirst({ where: r => eq(r.name, 'user') })
                    if (role === undefined) throw new NotFoundException('Role Not Seeded')

                    await tx.insert(userRoles).values({ roleId: role.id, userId: user.id }).returning()
                }

                await tx.delete(verifications).where(eq(verifications.id, verification.id))
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
    }

    async login(params: LoginParams) {
        return await this.db.transaction(async tx => {
            // find user
            const user = await tx.query.users.findFirst({
                where: user => eq(user.email, params.email),
                with: { userRoles: { with: { role: true } } }
            })
            if (!user || user === undefined) throw new NotFoundException('User Not Found')

            // find account
            const account = await tx.query.accounts.findFirst({
                where: account => {
                    return and(eq(account.userId, user.id), eq(account.providerId, params.providerId))
                }
            })
            if (!account || account === undefined) throw new NotFoundException('Account Not Found')

            // compare password for credentials only login
            if (params.providerId === 'credentials' && params.password !== null) {
                const comparePassword = await comparePasswordFn(params.password, account.password as string)
                if (!comparePassword) throw new UnauthorizedException('Invalid Password')
            }

            // sessions && tokens
            const sessionToken = generateSessionToken()

            // BUGS: SESSION.DELETE
            // await tx.delete(sessions).where(eq(sessions.userId, user.id))
            await tx.insert(sessions).values({
                token: hashToken(sessionToken),
                userId: user.id,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                expiresAt: dateUtils.addSevenDays()
            })

            return { sessionToken, user }
        })
    }

    async logout(parmas: LogoutParams) {
        const [destroyed] = await this.db.delete(sessions).where(eq(sessions.id, parmas.user.sessionId)).returning()
        if (!destroyed) throw new NotFoundException('Session Not Found')
        return destroyed
    }

    async profile(params: ProfileParams) {
        const [data] = await this.db
            .select({
                userId: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
                verifiedAt: users.verifiedAt,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                roleName: roles.name
            })
            .from(users)
            .leftJoin(userRoles, eq(userRoles.userId, users.id))
            .leftJoin(roles, eq(roles.id, userRoles.roleId))
            .where(eq(users.id, params.user.userId))

        if (!data) throw new NotFoundException('User Not Found')
        return data
    }

    async accountVerification(params: AccountVerificationParams) {
        const verification = await this.db.query.verifications.findFirst({
            where: v => eq(v.tokenHash, hashToken(params.token))
        })
        if (!verification) throw new NotFoundException('Verification Not Found')
        if (verification.expiresAt < new Date()) throw new UnauthorizedException('Verification Token Expired')

        const [user] = await this.db
            .update(users)
            .set({ verifiedAt: new Date() })
            .where(eq(users.id, verification.userId as string))
            .returning()
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
                .where(eq(sessions.token, hashToken(params.sessionToken)))

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

    async clearSession() {
        const now = new Date()
        await this.db.delete(sessions).where(lt(sessions.expiresAt, now))
    }
}
