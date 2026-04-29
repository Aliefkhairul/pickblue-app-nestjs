import { NodePgDatabase } from "drizzle-orm/node-postgres"
import * as schema from "src/schema/index"

export const dbConnection = "DB_CONNECTION_TOKEN_PG"
export type PgDatabase = NodePgDatabase<typeof schema>
