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
        providerId: text('provider_id').notNull(),
        password: text('password').notNull(),
        scope: text('scope'),
        idToken: text('id_token'),

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
    csrfToken: string
}
