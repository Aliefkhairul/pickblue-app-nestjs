import { pgTable, text, bigint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const sellerBalances = pgTable('seller_balances', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    creatorId: text('creator_id')
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),

    balance: bigint('balance', { mode: 'number' }).notNull().default(0),
    totalEarned: bigint('total_earned', { mode: 'number' }).notNull().default(0),
    totalWithdrawn: bigint('total_withdrawn', { mode: 'number' }).notNull().default(0),

    lastWithdrawnAt: timestamp('last_withdrawn_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type SellerBalance = typeof sellerBalances.$inferSelect
export type NewSellerBalance = typeof sellerBalances.$inferInsert
