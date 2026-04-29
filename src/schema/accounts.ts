import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./users"

export const accounts = pgTable(
    "accounts",
    {
        id: text("id")
            .primaryKey()
            .default(sql`gen_random_uuid()`),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        providerId: text("provider_id").notNull(),
        password: text("password").notNull(),
        scope: text("scope"),
        idToken: text("id_token"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    table => [unique().on(table.userId, table.providerId)],
)

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
