import * as dotenv from 'dotenv'
import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { users } from './users'

dotenv.config()

export const roleNameEnum = pgEnum('role_name', ['user', 'seller', 'admin'])

export const roles = pgTable('roles', {
    id: text('id')
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: roleNameEnum('name').notNull().unique(),
    isActive: text('is_active').notNull().default('true'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert

export const userRoles = pgTable(
    'user_roles',
    {
        id: text('id')
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        roleId: text('role_id')
            .notNull()
            .references(() => roles.id, { onDelete: 'cascade' }),

        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
    },
    t => [unique().on(t.userId, t.roleId)]
)

export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
