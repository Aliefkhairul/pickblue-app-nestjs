import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const sessions = pgTable(
    'sessions',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),

        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),

        token: text('token').notNull(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    t => [index('sessions_token_idx').on(t.token), index('sessions_user_id_idx').on(t.userId), index('sessions_expires_at_idx').on(t.expiresAt)]
).enableRLS()

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
