import { pgTable, pgEnum, text, bigint, integer, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { orders } from './orders'

export const sellerEarningsStatusEnum = pgEnum('seller_earnings_status', ['pending', 'settled'])

export const sellerEarnings = pgTable('seller_earnings', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    platformFee: integer('platform_fee').notNull().default(0),
    status: sellerEarningsStatusEnum('status').notNull().default('pending'),
    settledAt: timestamp('settled_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type SellerEarning = typeof sellerEarnings.$inferSelect
export type NewSellerEarning = typeof sellerEarnings.$inferInsert
