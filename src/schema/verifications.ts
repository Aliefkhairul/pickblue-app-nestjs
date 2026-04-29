import { pgTable, pgEnum, text, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./users"

export const verificationTypeEnum = pgEnum("verification_type", [
    "account_verification",
    "password_reset",
    "order_confirmation",
])

export const verifications = pgTable("verifications", {
    id: text("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: verificationTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull(),
    code: text("code"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
})

export type Verification = typeof verifications.$inferSelect
export type NewVerification = typeof verifications.$inferInsert
