import { Global, Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { dbConnection } from "./db_connection"
import * as schema from "src/schema/index"

@Global()
@Module({
    providers: [
        {
            provide: dbConnection,
            inject: [ConfigService],
            useFactory: async function (c: ConfigService) {
                const pool = new Pool({
                    connectionString: c.getOrThrow("DB_CONNECTION_STRING"),
                })

                const db = drizzle({ client: pool, schema: schema })
                const result = await db.execute("select 1")

                console.log("Database connection established ", result.rows)
                return db
            },
        },
    ],
    exports: [dbConnection],
})
export class DatabaseModule {}
