import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { products } from './products'

export const productPreviewImages = pgTable('product_preview_images', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    productId: text('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'cascade' }),
    mediaUrl: text('media_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type ProductPreviewImage = typeof productPreviewImages.$inferSelect
export type NewProductPreviewImage = typeof productPreviewImages.$inferInsert

export type CreateProductPreviewImagesParams = {
    productId: string
    mediaUrl: string
}[]
