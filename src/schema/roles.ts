import { sql } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const roleNameEnum = pgEnum("role_name", ["user", "seller", "admin"])

export const roles = pgTable("roles", {
    id: text("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: roleNameEnum("name").notNull().unique(),
    isActive: text("is_active").notNull().default("true"),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
})

export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
