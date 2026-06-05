---
name: database-migrations
description: "Use when modifying Drizzle ORM schema files in src/schema/, running migrations, resetting the database, or handling Drizzle queries and transactions in NestJS services."
---

# Database & Migrations

## ORM Setup

- **Drizzle ORM** + `node-postgres` pool via `@Global` `DatabaseModule` (src/database/database.module.ts)
- Injection token: `dbConnection` = `'DB_CONNECTION_TOKEN_PG'`, type: `PgDB`
- Inject into services: `@Inject(dbConnection) private readonly db: PgDB`

## Schema

- All table definitions live in `src/schema/`
- `src/schema/index.ts` re-exports every table type, insert type, and relation
- Relations defined in `src/schema/relations.ts`
- Drizzle config at root: `drizzle.config.ts` (dialect: postgresql, schema: ./src/schema, out: ./migrations)
- `user_wallets.ts` exists in schema dir but is **not** exported from `index.ts` — likely unused/incomplete

## Migration Workflow

1. Edit schema files in `src/schema/`
2. `npx drizzle-kit generate` — produces SQL in `migrations/`
3. `npx drizzle-kit migrate` — applies to DB (reads `DB_CONNECTION_STRING` from .env)
4. To reset: `pnpm run drop:db` (drops all tables + custom types via `src/schema/drop_table.ts`), then re-migrate

## Query Patterns

- Prefer `this.db.query.<table>.findMany/findFirst()` for reads with relations
- Use `this.db.select().from(table).where(...)` for filtered queries
- Transactions via `this.db.transaction(async tx => { ... })`
- Full-text search uses PostgreSQL `to_tsvector` / `websearch_to_tsquery`

## DB Error Handling

Map PostgreSQL error codes to NestJS HTTP exceptions:

| Code  | Meaning            | Exception              |
|-------|--------------------|------------------------|
| 23505 | Unique violation   | `ConflictException`    |
| 23503 | FK violation       | `BadRequestException`  |
| 22P02 | Invalid input      | `BadRequestException`  |
