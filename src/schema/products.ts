import { pgTable, pgEnum, text, bigint, timestamp, unique, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'

export const categoryNameEnum = pgEnum('category_name', ['illustration', 'digital_painting', 'concept_art', 'character_design', 'environment_art', 'pixel_art', 'vector_art', 'typography', 'photo_manipulation', 'ui_kit', '3d_render', 'motion_graphic', 'fan_art', 'abstract', 'other'])

export const products = pgTable(
    'products',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        name: text('name').notNull(),
        category: categoryNameEnum('category').default('other'),
        description: text('description').notNull(),
        details: text('details'),
        slug: text('slug').notNull(),
        price: bigint('price', { mode: 'number' }).notNull(),
        likesCount: bigint('likes_count', { mode: 'number' }).notNull().default(0),
        downloadsCount: bigint('downloads_count', { mode: 'number' }).notNull().default(0),
        allowedFormats: jsonb('allowed_formats').$type<string[]>().notNull(),
        tags: jsonb('tags').$type<string[]>().notNull(),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    table => [unique().on(table.userId, table.name)]
)

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type CategoryName = 'illustration' | 'digital_painting' | 'concept_art' | 'character_design' | 'environment_art' | 'pixel_art' | 'vector_art' | 'typography' | 'photo_manipulation' | 'ui_kit' | '3d_render' | 'motion_graphic' | 'fan_art' | 'abstract' | 'other'
export type CreateProductParams = {
    userId: string
    name: string
    category: CategoryName
    description: string
    details?: string
    slug: string
    price: number
    allowedFormats: string[]
    tags: string[]
}
