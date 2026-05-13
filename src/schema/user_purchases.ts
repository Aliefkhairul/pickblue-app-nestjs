import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { products } from './products'
import { orders } from './orders'

export const userPurchases = pgTable(
    'user_purchases',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        customerId: text('customer_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => [unique().on(table.customerId, table.productId)]
).enableRLS()

export type UserPurchase = typeof userPurchases.$inferSelect
export type NewUserPurchase = typeof userPurchases.$inferInsert
