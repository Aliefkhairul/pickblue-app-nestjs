import { pgTable, pgEnum, text, bigint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { orders } from './orders'

export const paymentStatusEnum = pgEnum('payment_status_name', ['pending', 'settled', 'expired', 'failed', 'cancelled'])

export const payments = pgTable('payments', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    orderId: text('order_id')
        .notNull()
        .unique()
        .references(() => orders.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    invoiceId: text('invoice_id'),
    paymentUrl: text('payment_url'),
    snapToken: text('snap_token'),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: paymentStatusEnum('status').default('pending'),
    provider: text('provider').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS()

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
