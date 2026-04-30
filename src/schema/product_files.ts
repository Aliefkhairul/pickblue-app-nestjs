import { pgTable, text, bigint, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'

export const productFiles = pgTable('product_files', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    productId: text('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    publicId: text('public_id').notNull(),
    mediaUrl: text('media_url').notNull(),
    resourceType: text('resource_type').notNull(),
    format: text('format').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type ProductFile = typeof productFiles.$inferSelect
export type NewProductFile = typeof productFiles.$inferInsert

export type CreateProductFilesParams = {
    productId: string
    fileName: string
    fileSize: number
    publicId: string
    mediaUrl: string
    resourceType: string
    format: string
}[]
