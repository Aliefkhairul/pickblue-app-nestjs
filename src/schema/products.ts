import { sql } from 'drizzle-orm'
import { bigint, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

export const products = pgTable(
    'products',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        creatorId: text('creator_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        name: text('name').notNull(),
        categories: jsonb('categories').$type<string[]>().notNull(),
        description: text('description').notNull(),
        details: text('details'),
        slug: text('slug').notNull(),
        price: bigint('price', { mode: 'number' }).notNull(),
        likesCount: bigint('likes_count', { mode: 'number' }).notNull().default(0),
        downloadsCount: bigint('downloads_count', { mode: 'number' }).notNull().default(0),
        tags: jsonb('tags').$type<string[]>().notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => [unique().on(table.creatorId, table.name)]
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type CreateProductParams = {
    creatorId: string
    name: string
    categories: string[]
    description: string
    details?: string
    slug: string
    price: number
    tags: string[]
}
