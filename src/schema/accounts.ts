import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

export const accounts = pgTable(
    'accounts',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),

        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),

        accessTokenExpiresAt: timestamp('access_token_expires_at', { precision: 6, withTimezone: true }),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { precision: 6, withTimezone: true }),

        scope: text('scope'),
        idToken: text('id_token'),

        password: text('password'),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    t => [unique().on(t.userId, t.providerId)]
)

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type SignUpParams = {
    name: string
    email: string
    password: string
    providerId: string
}

export type SignInParams = {
    email: string
    password: string
    providerId: string
    ipAddress: string
    userAgent: string
}

export type AccountVerificationParams = {
    token: string
    email: string
}

export type GetAuthenticatedUserParams = {
    sessionToken: string
}
