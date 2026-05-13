import { sql } from 'drizzle-orm'
import { bigint, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'approved', 'rejected', 'processed'])
export const withdrawalDestinationTypeEnum = pgEnum('withdrawal_destination_type', ['bank', 'ewallet'])

export const withdrawals = pgTable('withdrawals', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),

    // Pastikan ini merujuk ke id user yang menarik saldo
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    platformFeePercent: integer('platform_fee_percent').notNull().default(2),
    platformFee: bigint('platform_fee', { mode: 'number' }).notNull(),
    netAmount: bigint('net_amount', { mode: 'number' }).notNull(),

    status: withdrawalStatusEnum('status').notNull().default('pending'),

    destinationType: withdrawalDestinationTypeEnum('destination_type').notNull(),
    destinationName: text('destination_name').notNull(), // Contoh: 'BCA', 'GOPAY'
    destinationAccount: text('destination_account').notNull(), // Nomor Rekening/HP
    destinationHolder: text('destination_holder').notNull(), // Nama di rekening

    rejectionReason: text('rejection_reason'),

    // Timestamps
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),

    // Standar audit columns
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS()

export type Withdrawal = typeof withdrawals.$inferSelect
export type NewWithdrawal = typeof withdrawals.$inferInsert
