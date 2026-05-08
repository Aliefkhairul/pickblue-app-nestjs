import { sql } from 'drizzle-orm'
import { bigint, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orders } from './orders'
import { users } from './users'

export const creatorEarningsStatusEnum = pgEnum('creator_earnings_status', ['pending', 'settled', 'distributed'])

export const creatorEarnings = pgTable('creator_earnings', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    creatorId: text('creator_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    orderId: text('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: creatorEarningsStatusEnum('status').notNull().default('pending'),

    // KOLOM KRITIKAL: Untuk nentuin kapan 3 hari itu berakhir
    // Diisi saat status berubah jadi 'settled'
    availableAt: timestamp('available_at', { withTimezone: true }),

    settledAt: timestamp('settled_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type CreatorEarning = typeof creatorEarnings.$inferSelect
export type NewCreatorEarning = typeof creatorEarnings.$inferInsert
