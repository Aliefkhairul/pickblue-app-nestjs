import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
    connectionString: process.env.DB_CONNECTION_STRING
})

const db = drizzle({ client: pool })

async function dropAllTables() {
    await db.execute(sql`
        DROP TABLE IF EXISTS "user_purchases" CASCADE;
        DROP TABLE IF EXISTS "seller_balances" CASCADE;
        DROP TABLE IF EXISTS "seller_earnings" CASCADE;
        DROP TABLE IF EXISTS "payments" CASCADE;
        DROP TABLE IF EXISTS "order_items" CASCADE;
        DROP TABLE IF EXISTS "orders" CASCADE;
        DROP TABLE IF EXISTS "cart_items" CASCADE;
        DROP TABLE IF EXISTS "product_preview_images" CASCADE;
        DROP TABLE IF EXISTS "product_files" CASCADE;
        DROP TABLE IF EXISTS "products" CASCADE;
        DROP TABLE IF EXISTS "verifications" CASCADE;
        DROP TABLE IF EXISTS "sessions" CASCADE;
        DROP TABLE IF EXISTS "user_roles" CASCADE;
        DROP TABLE IF EXISTS "roles" CASCADE;
        DROP TABLE IF EXISTS "accounts" CASCADE;
        DROP TABLE IF EXISTS "users" CASCADE;

        DROP TYPE IF EXISTS "public"."order_status";
        DROP TYPE IF EXISTS "public"."payment_status_name";
        DROP TYPE IF EXISTS "public"."seller_earnings_status";
        DROP TYPE IF EXISTS "public"."category_name";
        DROP TYPE IF EXISTS "public"."role_name";
        DROP TYPE IF EXISTS "public"."verification_type";
    `)

    console.log('All tables dropped successfully')
    await pool.end()
}

dropAllTables()
