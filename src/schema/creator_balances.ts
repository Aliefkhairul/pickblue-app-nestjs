import { pgTable, text, bigint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const creatorBalances = pgTable(
    'creator_balances',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        creatorId: text('creator_id')
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: 'cascade' }),

        // Kantung Biru: Hanya uang yang benar-benar siap tarik
        balance: bigint('balance', { mode: 'number' }).notNull().default(0),

        // Statistik untuk Dashboard
        totalEarned: bigint('total_earned', { mode: 'number' }).notNull().default(0),
        totalWithdrawn: bigint('total_withdrawn', { mode: 'number' }).notNull().default(0),

        // Audit Trail
        lastWithdrawnAt: timestamp('last_withdrawn_at', { withTimezone: true }),

        // Penting untuk tracking kapan terakhir kali worker mindahin saldo
        // dari creator_earnings ke sini
        lastSettledAt: timestamp('last_settled_at', { withTimezone: true }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => ({
        // Mencegah balance minus di level database (Safety Net)
        balanceNonNegative: sql`check (${table.balance} >= 0)`
    })
)

export type CreatorBalance = typeof creatorBalances.$inferSelect
export type NewCreatorBalance = typeof creatorBalances.$inferInsert
