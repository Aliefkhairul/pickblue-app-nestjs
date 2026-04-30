import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from 'src/schema/index'

export const dbConnection = 'DB_CONNECTION_TOKEN_PG'
export type PgDB = NodePgDatabase<typeof schema>

@Global()
@Module({
    providers: [
        {
            provide: dbConnection,
            inject: [ConfigService],
            useFactory: async function (c: ConfigService) {
                const pool = new Pool({
                    connectionString: c.getOrThrow<string>('DB_CONNECTION_STRING')
                })

                const db = drizzle({ client: pool, schema: schema })
                const result = await db.execute('select 1')

                console.log('Database connection established ', result.rows)
                return db
            }
        }
    ],
    exports: [dbConnection]
})
export class DatabaseModule {}
