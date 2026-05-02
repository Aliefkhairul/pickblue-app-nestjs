import { pgTable, pgEnum, text, bigint, integer, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { products } from './products'

export const orderStatusEnum = pgEnum('order_status', ['pending', 'settled', 'expired', 'failed', 'cancelled'])

export const orders = pgTable('orders', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    customerId: text('customer_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    orderCode: text('order_code').notNull().unique(),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
    status: orderStatusEnum('status').notNull().default('pending'),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export const orderItems = pgTable('order_items', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    orderId: text('order_id')
        .notNull()
        .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    productNameSnapshot: text('product_name_snapshot').notNull(),
    productDescriptionSnapshot: text('product_description_snapshot').notNull(),
    productDetailsSnapshot: text('product_details_snapshot'),
    productPriceSnapshot: bigint('product_price_snapshot', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    subTotal: bigint('sub_total', { mode: 'number' }).notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
