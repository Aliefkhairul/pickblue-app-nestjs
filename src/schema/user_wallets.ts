import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { pgEnum } from 'drizzle-orm/pg-core'
import { bigint } from 'drizzle-orm/pg-core'

export const userWalletsEnum = pgEnum('user_wallet_type', ['bank', 'e-wallet'])
export const userWallets = pgTable('user_wallets', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),

    type: userWalletsEnum('type').notNull().default('e-wallet'),
    name: text('name').notNull(),
    number: bigint('number', { mode: 'number' }).notNull(),
    holder: text('holder').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}).enableRLS()
