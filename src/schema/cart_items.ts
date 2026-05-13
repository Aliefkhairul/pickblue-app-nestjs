import { pgTable, text, integer, timestamp, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { products } from './products'

export const cartItems = pgTable(
    'cart_items',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        customerId: text('customer_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        quantity: integer('quantity').notNull().default(1),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => [unique().on(table.customerId, table.productId)]
).enableRLS()

export type CartItem = typeof cartItems.$inferSelect
export type NewCartItem = typeof cartItems.$inferInsert

export type CreateCartParams = {
    customerId: string
    productId: string
    quantity: number
}
