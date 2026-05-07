import { pgTable, text, timestamp, bigint, integer, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'approved', 'rejected', 'processed'])
export const withdrawalDestinationTypeEnum = pgEnum('withdrawal_destination_type', ['bank', 'ewallet'])

export const withdrawals = pgTable('withdrawals', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    userId: text('user_id')
        .notNull()
        .references(() => users.id),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    platformFeePercent: integer('platform_fee_percent').notNull().default(2),
    platformFee: bigint('platform_fee', { mode: 'number' }).notNull(),
    netAmount: bigint('net_amount', { mode: 'number' }).notNull(),

    status: withdrawalStatusEnum('status').notNull().default('pending'),

    destinationType: withdrawalDestinationTypeEnum('destination_type').notNull(),
    destinationName: text('destination_name').notNull(),
    destinationAccount: text('destination_account').notNull(),
    destinationHolder: text('destination_holder').notNull(),

    rejectionReason: text('rejection_reason'),

    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true })
})

export type Withdrawal = typeof withdrawals.$inferSelect
export type NewWithdrawal = typeof withdrawals.$inferInsert
