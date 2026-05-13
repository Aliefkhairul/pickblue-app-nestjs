import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { products } from './products'

export const productLikes = pgTable(
    'product_likes',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => [unique().on(table.userId, table.productId)]
).enableRLS()

export type ProductLike = typeof productLikes.$inferSelect
export type NewProductLike = typeof productLikes.$inferInsert
